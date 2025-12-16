# Week 20 — Insights, Tasks & Calendar Surfaces

## Objectives

- Give founders a **single place to see whether Harmonyk is doing work for them** (Insights).

- Provide a **lightweight Task Hub** for tracking follow-ups across docs, signatures, and deals.

- Layer a **read-only weekly agenda** view over open, dated tasks (Calendar).

This week focused on polishing the "meta" layer around docs: **what happened, what's next, and when**.

---

## What Was Delivered

### 1. Insights Overview Page (`/insights`)

> Status: **Implemented (GA shell)** — uses existing event/usage scaffolding, safe to keep as a "v1 dashboard" even if numbers are low in early usage.

Key behaviours:

- **Header + tagline** aligned with the latest product positioning (docs, signatures, playbooks, tasks).

- **Summary cards** for high-signal KPIs (e.g. docs touched, signatures, share links, tasks), designed to tolerate zero/low data gracefully.

- **Recent activity table / list**:

  - Shows a compact feed of recent events across Vault / Share / Signatures / Tasks.

  - Uses existing telemetry/events schema where available; otherwise degrades to demo-safe or minimal rows.

- **GA posture**:

  - No destructive actions from Insights.

  - No configuration panels that could get out of sync with underlying feature flags.

  - Clear language that this is a **snapshot**, not a fully custom analytics workspace (that's a post-GA enhancement).

Constraints & Notes:

- Reads data only; **no writes** from this page.

- Safe to show even if underlying tables are sparsely populated; should never 500 due to "no data".

### 2. Task Hub Overview Page (`/tasks`)

> Status: **Implemented (GA)** — fully wired to `/api/tasks` and the `tasks` table.

Key behaviours:

- **Org-scoped tasks** via `/api/tasks`:

  - `GET /api/tasks` supports `status`, `source`, `page`, and `limit` query params.

  - Robust error handling for:

    - Missing `tasks` table (`42P01`) with explicit migration hints.

    - Schema mismatch (missing columns) with guidance to run the org-scoped migration.

  - Tasks are always scoped to the current org via `org_id`.

- **Add New Task**:

  - Creates a manual task via `POST /api/tasks` with:

    - `title` (required, trimmed).

    - `source = "manual"`.

    - `status = "open"`.

    - Optional `due_at` (saved as ISO string).

  - On success:

    - Toast: "Task created successfully".

    - Clears form and reloads list via `loadTasks()`.

  - On failure:

    - Detailed console logging (status, body, parsed error).

    - Destructive toast with error reason.

- **Task List**:

  - Filters:

    - Status: `all | open | done`.

    - Source: `all | activity | mono | manual`.

  - Status toggle:

    - Checkbox toggles between `open` and `done` via `PATCH /api/tasks`.

  - Due date edit:

    - Simple `prompt`-based editor for now, calling `PATCH /api/tasks` with new `due_at` or `null`.

  - Visual cues:

    - "Done" tasks are faded and struck through.

    - Overdue tasks (open + past due date) get red highlighting and an "Overdue" badge.

    - Related doc link points to `/vault` when `doc_id` is present (GA-safe placeholder).

- **Summary cards**:

  - Open, Completed, Total, Overdue — all derived from the currently loaded tasks.

Constraints & Notes:

- **Migration requirement**:

  - Expects `supabase/migrations/202511281030_tasks_org_scoped_v1.sql` to have been run.

  - Error panel and console warnings explicitly reference this migration path.

- No bulk actions yet (bulk complete, bulk reschedule) — out of GA scope.

### 3. Task Calendar Week View (`/calendar`)

> Status: **Implemented (GA)** — read-only week agenda over open tasks with due dates.

Key behaviours:

- **Data source**:

  - Fetches from `/api/tasks` with:

    - `status=open`.

    - `limit=200` (defensive cap).

  - Shares the same error-handling pattern and migration hints as `/tasks`.

- **Week view**:

  - Week always starts on **Monday**.

  - "Previous week", "This week", "Next week" controls adjust the reference week.

  - Today's column is visually highlighted.

- **Per-day cards**:

  - Each day shows:

    - Label: "Today · Mon 2 Dec" style for the current day.

    - Count of scheduled tasks.

    - List of tasks with:

      - Title.

      - Due time (if present).

      - Source badge (`activity | mono | manual`).

      - Optional "View doc" link when `doc_id` is present (routes to `/vault`).

- **Overdue strip**:

  - Summarises all open tasks with `due_at` **before today**.

  - Shows up to 5 items inline; the rest collapsed into a "+N more" line.

Constraints & Notes:

- Calendar is **read-only**:

  - No status toggles.

  - No date edits.

  - All writes remain in `/tasks` for GA.

- Handles sparse data and missing tables gracefully, with messaging mirroring `/tasks`.

---

## Files Touched This Week (Insights / Tasks / Calendar)

- `app/(protected)/tasks/page.tsx`

  - Task Hub UI, task creation, filters, and table wiring.

- `app/api/tasks/route.ts`

  - Org-scoped tasks API: `GET`, `POST`, `PATCH` with robust error reporting and demo-safe org creation.

- `app/(protected)/calendar/page.tsx`

  - Weekly calendar view for open tasks with due dates and overdue strip.

- `app/(protected)/insights/page.tsx`

  - Insights dashboard shell with summary cards and recent activity view (per earlier Week 20 diff).

See `docs/INSIGHTS_TASKS_CALENDAR_QA_CHECKLIST.md` for manual testing steps.

---

## Next Steps (Post-GA)

- Wire Insights into richer, org-level analytics (e.g. pipeline health, Mono automation coverage).

- Extend Tasks with:

  - Document-level task creation shortcuts (from Vault, Builder, Signatures).

  - Light categorisation (deal vs ops vs product work).

- Evolve Calendar into:

  - Optional month view toggle.

  - Simple drag-to-reschedule for tasks (still backed by the same `/api/tasks` endpoints).

