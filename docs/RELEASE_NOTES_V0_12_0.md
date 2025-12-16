# v0.12.0 – Signatures Fix + Task Hub & Notifications v1

Status: Local dev  
Scope: Signature flow fixes, Documenso integration (dev stub), Task Hub v1, and in-app reminders.

---

## Overview

Harmonyk v0.12.0 introduces **Signatures Fix + Task Hub & Notifications v1**:

- Fixed "Send for signature" flow with improved error handling and dev stub support
- New **Task Hub** (`/tasks`) for managing org-scoped tasks
- New **Task Reminders** component showing due and overdue tasks on Task Hub and Workbench
- Improved UX polish for Signatures and Task Hub pages
- Cross-page navigation links for better discoverability

This is a **v1 release** designed to provide basic task management and signature flow improvements, laying the foundation for future enhancements.

---

## New features

### 1. Task Hub (`/tasks`)

A dedicated page for managing tasks across your workspace.

**Features:**

- **Task management:**
  - Create tasks manually (title, optional due date)
  - Mark tasks as done
  - Update task due dates
  - Filter by status (Open/Done/All) and source (Activity/Mono/Manual)

- **Task display:**
  - Table view with columns: status, title, source, due date, related document
  - Statistics cards: Open, Completed, Total, Overdue
  - Visual indicators for overdue tasks (red highlight)
  - Empty states for "no tasks yet" and "all done"

- **Task sources:**
  - `manual` – Tasks created directly by users
  - `activity` – Tasks created from activity events (future)
  - `mono` – Tasks created by Mono AI (future)

- **Responsive design:**
  - Mobile-friendly layout (375px width)
  - Horizontal scrolling for table on narrow screens
  - Wrapped filters and appropriately sized buttons

### 2. Task Reminders

In-app reminders for tasks due today or overdue.

**Features:**

- **Reminders component:**
  - Shows up to 5 tasks that are due today or overdue
  - Sorted by priority (overdue first, then due today)
  - Visual indicators (red for overdue, orange for due today)
  - Positive empty state when no reminders

- **Placement:**
  - Task Hub page (above task list)
  - Workbench page (below Drive Recent section)

- **Navigation:**
  - "View Task" link → `/tasks`
  - "View Doc" link → `/vault` (if task has related document)
  - "View All Tasks" button → `/tasks`

### 3. Signature Flow Fixes

Improved "Send for signature" flow with better error handling and dev stub support.

**Features:**

- **Dev stub support:**
  - In development, when document lookup fails, returns stub success instead of hard failure
  - Stub returns `{ ok: true, envelopeId: "dev-stub-envelope-no-file" }`
  - Builder UI detects stub and shows appropriate toast message
  - Unblocks development workflow while full Documenso wiring is implemented

- **Error handling:**
  - Improved error messages throughout the signature flow
  - Clear feedback when document must be saved to Vault first
  - Better error propagation from Documenso API

- **Builder integration:**
  - "Send for signature" button works reliably
  - Toast notifications for success/failure
  - Stub detection and user feedback

### 4. Signatures Page Improvements

Enhanced UX for the Signatures page.

**Features:**

- **Better feedback:**
  - Clear success/failure messages
  - Toast notifications for actions
  - Improved empty states

- **Responsive design:**
  - Mobile-friendly layout (375px width)
  - Properly sized buttons and cards
  - Responsive grid layout for stats cards

- **Navigation:**
  - "Send for Signature" button redirects to Workbench
  - Links to related documents from Activity events

### 5. Cross-Page Navigation

Added navigation links for better discoverability.

**Features:**

- From Activity events:
  - Links to related documents (if `document_id` present)
  - Links to Signatures page (for signature events)
  - Links to Task Hub (for task-related events, future)

- From Task Hub:
  - Links to related documents from task table
  - Links from reminders to documents

---

## Technical changes

### New files

- `supabase/migrations/202511281030_tasks_org_scoped_v1.sql` – Tasks table migration (org-scoped)
- `app/api/tasks/route.ts` – Tasks API (GET, POST, PATCH)
- `app/(protected)/tasks/page.tsx` – Task Hub UI
- `components/tasks/TaskReminders.tsx` – Reminders component
- `docs/SIGNATURES_DOCUMENSO_TROUBLESHOOTING.md` – Internal troubleshooting guide
- `docs/QA_SHARE_SIGNATURES_TASKS_V1.md` – QA testing guide

### Updated files

- `app/api/sign/documenso/route.ts` – Added dev stub support, improved error handling
- `components/builder/builder-client.tsx` – Improved signature error handling, stub detection
- `app/(protected)/signatures/page.tsx` – UX improvements, responsive design
- `app/(protected)/workbench/page.tsx` – Added TaskReminders component
- `app/(protected)/activity/_components/activity-client.tsx` – Added cross-page links
- `app/(protected)/layout.tsx` – Added shadcn/ui Toaster for toast notifications
- `lib/handle-api-error.ts` – Improved error logging

---

## Known limitations (v1)

The following are explicitly **out of scope for v1**:

### Signatures

- Real Documenso integration in development (stub is used for development)
- Signature completion webhooks (basic event logging only)
- Signature status tracking (envelope status not synced in real-time)
- Multiple recipients (single recipient only)
- Custom signature fields

### Tasks

- Google Tasks/Calendar sync
- Email notifications for task reminders
- Complex task assignment (tasks are org-scoped, not per-user assigned)
- Task templates or recurring tasks
- Advanced task search
- Task attachments
- Task comments or notes

### Share

- Share link analytics (views, downloads)
- Share link expiration enforcement (if implemented, needs testing)
- Advanced share permissions

We only want:

- Basic task management (create, update, mark done, filter)
- Simple reminders (due today, overdue) shown in-app
- Share link creation and access
- Signature flow foundation (with dev stub for development)
- Cross-page navigation for discoverability

---

## Future v2 considerations

Potential enhancements for a future v2 release:

### Signatures

- Full Documenso integration (replace dev stub with real API calls)
- Signature completion webhooks
- Multiple recipients support
- Custom signature fields
- Signature status tracking and sync
- Signature analytics

### Tasks

- Google Tasks/Calendar sync
- Email notifications
- Per-user task assignment
- Task templates and recurring tasks
- Advanced search and filtering
- Task attachments and comments
- Task priorities and tags

### Share

- Share link analytics
- Advanced share permissions
- Share link expiration enforcement
- Share link access logs

---

## Migration notes

**Database migration required** – This release adds a new `tasks` table. Run the migration:

```sql
-- Migration: supabase/migrations/202511281030_tasks_org_scoped_v1.sql
```

**No breaking changes** – Existing Share and Signature flows continue to work. Tasks API is additive.

**Environment variables** – No new environment variables required for Tasks. Documenso env vars remain the same (DOCUMENSO_API_URL, DOCUMENSO_API_TOKEN).

**RLS policies** – Tasks API relies on Row Level Security policies for org scoping. Ensure RLS is properly configured in your Supabase project.

---

## Testing

See `docs/QA_SHARE_SIGNATURES_TASKS_V1.md` for comprehensive testing instructions.

**Quick smoke test:**

1. Visit `/tasks` → verify page loads and shows empty state
2. Create a task → verify it appears in the list
3. Mark task as done → verify status updates
4. Create task with due date today → verify reminder appears
5. Go to `/builder` → create document, save to Vault, send for signature
6. Verify toast notification appears (dev stub in development)
7. Visit `/activity` → verify signature event appears
8. Test on mobile (375px width) → verify responsive design

---

## Dependencies

No new external dependencies added. Uses existing:

- Supabase client (`lib/supabase-server.ts`)
- Next.js App Router
- Shadcn/ui components (Card, Badge, Button, Table, etc.)
- Toast notifications (shadcn/ui toaster)

---

## Changelog

### Added

- Task Hub page (`/tasks`) with task management UI
- Tasks API (`GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks`)
- Tasks database schema (org-scoped)
- Task Reminders component (Task Hub and Workbench)
- Dev stub support for signatures in development
- Improved error handling for signature flow
- Cross-page navigation links (Activity → Signatures, Activity → Documents)
- QA testing guide (`docs/QA_SHARE_SIGNATURES_TASKS_V1.md`)
- Internal troubleshooting guide (`docs/SIGNATURES_DOCUMENSO_TROUBLESHOOTING.md`)

### Changed

- Signature flow now supports dev stub in non-production environments
- Builder signature error messages improved and more actionable
- Signatures page UX improved (responsive, better feedback)
- Activity page now includes links to related documents and Signatures
- Workbench page now shows Task Reminders
- Protected layout now includes shadcn/ui Toaster component

### Fixed

- Signature flow no longer hard-fails in development (uses stub)
- Error messages properly serialized and displayed
- Toast notifications now work correctly (added missing Toaster component)
- Mobile responsiveness for Signatures and Task Hub pages
- Task Hub empty states and error handling

---

**Release date:** 2025-11-28  
**Version:** v0.12.0  
**Tag:** `v0.12.0-task-hub-notifications-v1`

