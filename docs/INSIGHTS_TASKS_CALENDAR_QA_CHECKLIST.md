# QA Checklist — Insights, Tasks & Calendar

This checklist is for manual smoke testing of the Week 20 surfaces:

- Insights dashboard (/insights)

- Task Hub Overview (/tasks)

- Task Calendar (/calendar)

Run these after npm run dev is up and the database migrations (including 202511281030_tasks_org_scoped_v1.sql) have been applied.

---

## 1. Insights Dashboard (/insights)

1. Page loads

Navigate to /insights.

Confirm:

- The heading and tagline render.

- Summary cards render (even if the values are zero).

- A recent activity section or table is visible.

2. Empty / low-data behaviour

In a clean or low-usage dev environment:

- Confirm the page does **not** crash or show generic error screens.

- Text should clearly tolerate "no data yet" states.

3. Nav consistency

From /insights, use the main sidebar nav to jump to:

- `/vault`

- `/share`

- `/tasks`

Confirm the nav state and page headings match the rest of the app.

4. No destructive actions

Confirm there are no buttons on Insights that:

- Delete docs.

- Change permissions.

- Modify tasks.

---

## 2. Task Hub Overview (/tasks)

> Assumes supabase/migrations/202511281030_tasks_org_scoped_v1.sql has been run and the tasks table exists.

### 2.1 Basic page load & summary cards

1. Navigate to /tasks.
2. Confirm:

"Task Hub" heading and tagline render.

Tabs for Overview and Calendar are visible, with Overview selected.

Summary cards show counts for Open, Completed, Total, and Overdue.

No error banner is shown if the tasks table exists and is reachable.

### 2.2 Creating a task

1. In the "Add New Task" card:

Enter a title, e.g. Test task 1.

Leave Due Date empty.

Click Add Task.
2. Confirm:

A success toast appears: "Task created successfully".

The title input clears.

The new task appears in the table with:

- Status = `open`.

- Source badge = `Manual`.

- "No due date" in the Due Date column.

Summary cards update (Open / Total).

3. Create a second task with a due date:

Enter title, e.g. Test task with due date.

Set a datetime-local field to a time later today.

Click Add Task.

Confirm it appears with a rendered date and no "Overdue" badge.

### 2.3 Status toggle

1. In the table, tick the checkbox for one of the open tasks.
2. Confirm:

Status badge switches to done.

Row appears faded and title is struck through.

Open / Completed / Total cards update accordingly.
3. Untick the checkbox.

Confirm it returns to open and counts update.

### 2.4 Due date editing

1. For a task with a due date:

Click the clock icon button in the Actions column.

In the prompt, enter a new ISO-like string, e.g. 2030-01-01T10:00.

Confirm the date updates in the table after reload.
2. Repeat and clear the date:

Click the clock icon again.

Submit an empty string.

Confirm the row now shows "No due date".

### 2.5 Filters

1. Use the Status filter to switch between:

All, Open, Done.

Confirm the table rows and "X tasks total" label reflect the selection.
2. Use the Source filter to:

Show only Manual tasks.

Confirm other sources (if present) are hidden.

### 2.6 Error handling (optional / destructive)

> Only in a separate, disposable environment.

- Temporarily break the tasks table (e.g. rename or drop it) and hit /tasks.

Confirm the error banner:

Mentions the missing table or outdated schema.

Points to supabase/migrations/202511281030_tasks_org_scoped_v1.sql.

---

## 3. Task Calendar (/calendar)

### 3.1 Basic load & nav

1. Navigate to /calendar.
2. Confirm:

"Task Calendar" heading and tagline render.

Tabs show Overview and Calendar, with Calendar selected.

The Week Overview card shows a week range, e.g. Dec 1 – Dec 7.

### 3.2 Tasks rendering on the week grid

1. Ensure you have at least one open task with a due_at in the current week.
2. Confirm:

The corresponding day card:

- Shows "X tasks scheduled".

- Lists the task title and time (if `due_at` has a time).

- Shows a source badge (`activity`, `mono`, or `manual`).

3. If the task has a doc_id, confirm:

A "View doc" link is visible and routes to /vault when clicked.

### 3.3 Overdue strip

1. Create an open task with a due date in the past (yesterday or earlier).
2. Refresh /calendar.
3. Confirm:

The Overdue section appears inside Week Overview.

The overdue task is listed with its title (and time if set).

### 3.4 Week navigation

1. Click Next week:

Confirm the week range updates to the following week.

Day cards update accordingly (may show "No tasks scheduled" if there are none).
2. Click Previous week repeatedly:

Confirm navigation is smooth and doesn't error.
3. Click This week:

Confirm the calendar returns to the current week and today's card is highlighted.

### 3.5 Relationship with Task Hub

1. From /calendar, click the "Task Hub" link at the bottom.
2. Confirm:

You are taken to /tasks.

Newly created or edited tasks in /tasks appear correctly in /calendar once they have due_at values and are still open.

---

## 4. General Regression Checks

1. Sidebar nav:

Ensure that navigating between /insights, /tasks, /calendar, /vault, /share, /signatures, and /share/contacts keeps the sidebar state consistent.
2. Auth / org context:

Confirm that tasks created while logged in appear only under the current org.
3. Commands:

npm run lint — no new warnings or errors.

npm run build — succeeds without additional TypeScript or runtime build errors.

npm run dev — /insights, /tasks, and /calendar all load without unhandled errors.

