# Week 12 – Instructions

Theme: **Signatures Fix + Task Hub & Notifications v1**

Goal for this week:

- Fix the "Send for signature" flow end-to-end with Documenso so signatures are reliable and observable.

- Introduce a minimal but real Task Hub (tasks schema + API + UI).

- Surface basic in-app reminders based on tasks (no heavy notification system yet).

This file is the source of truth for Week 12. Implement tasks day-by-day and do not jump ahead without explicit approval.

---

## Day 1 – Signature flow audit & failure modes

- Trace the "Send for signature" button path from the UI to the API (and any Documenso client/helper).

- Confirm which API route is called (URL, method, payload) and what response/error comes back.

- Improve logging and error propagation so failures surface a real message, not a silent no-op.

- Document the current `signature_*` event types and where they're emitted (if at all).

## Day 2 – Documenso integration fix – end to end

- Add or repair the Documenso client/helper (URL, API key, envelopes endpoint) and centralize config into a single module.

- Update the signatures API route so "Send for signature" creates a Documenso envelope, handles errors cleanly, and returns a useful response.

- Ensure required env vars are validated on startup or first use with clear error messages.

- Manually send a test document for signature, complete the flow in Documenso, and confirm `signature_*` events are written to `activity_log` and visible in `/activity` and `/insights`.

- Add or extend a short doc (e.g. `docs/INTEGRATIONS_DOCUMENSO.md`) explaining env vars and manual test steps.

## Day 3 – Tasks schema & API

- Add a `tasks` table in Supabase with fields at minimum:

  - `id`

  - `org_id`

  - `user_id` (optional)

  - `source` (`"activity"` | `"mono"` | `"manual"`)

  - `title`

  - `status` (`"open"` | `"done"`)

  - `due_at` (nullable)

  - `doc_id` / `activity_id` (nullable)

  - `created_at`, `updated_at`

- Add or update migration files accordingly and apply them.

- Implement `/api/tasks` with:

  - `GET` (filters: status, source, pagination),

  - `POST` (create task),

  - `PATCH` (update status and `due_at`).

- Ensure all task queries are org-scoped and respect the existing auth/org model.

## Day 4 – Task Hub UI v1

- Add a protected Task Hub route (e.g. `/tasks` or `/task-hub`) and surface it in the nav.

- Render a table or list of tasks with columns: title, source, status, due date, related doc (if any).

- Add lightweight filters for status (Open/Done/All) and source.

- Support basic interactions:

  - Mark task as done.

  - Set or change due date.

- Make sure empty states are handled (e.g. "no tasks yet", "all done").

## Day 5 – Notifications v1 (in-app reminders)

- Decide minimal v1 behavior: show "due today" and "overdue" tasks in an obvious place (Task Hub and/or Workbench).

- Implement a small "Reminders" block or badge that surfaces tasks where `due_at <= today` and `status = open`.

- Add navigation affordances from reminders to:

  - Full Task Hub, and

  - The related doc where reasonable.

- Ensure this logic is cheap (no heavy polling; reuse existing data where possible).

## Day 6 – UX polish for Signatures + Task Hub

- Improve copy and error messages on the signatures page (clear feedback for success/failure).

- Tidy the Task Hub layout: spacing, text styles, responsive behavior (including around 375px width).

- Ensure Task Hub and signatures pages both behave sensibly on narrow viewports (overflow-x, wrapping, button sizes).

- Add links between pages where it obviously helps (for example, from a signature event in Activity to the related doc, if trivial to implement).

## Day 7 – QA, docs & v0.12.0 tag

- Create `docs/QA_SHARE_SIGNATURES_TASKS_V1.md` covering:

  - How to test share links from Builder/Vault.

  - How to send and complete signatures.

  - How to create/update tasks and see reminders.

- Create `docs/RELEASE_NOTES_V0_12_0.md` summarizing:

  - Signature flow fixes and Documenso integration state.

  - Task Hub & Notifications v1 scope and known limitations.

- Run:

  - `npm run lint`

  - `npm run test`

  - `npm run build`

- Do a quick manual pass over:

  - `/vault` (share),

  - The signatures page,

  - `/activity`,

  - `/insights`,

  - Task Hub,

  - Any reminder surfaces.

- Commit and tag:

  - `git add .`

  - `git commit -m "v0.12.0 – Signatures fix + Task Hub & Notifications v1"`

  - `git tag v0.12.0-task-hub-notifications-v1`

