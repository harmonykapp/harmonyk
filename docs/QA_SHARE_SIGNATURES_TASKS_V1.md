# QA – Share, Signatures & Tasks v1 (Week 12)

This checklist is for validating the Share, Signatures, and Tasks v1 implementation before moving on to Week 13.

Focus areas:

- Share: Creating and accessing share links from Builder/Vault
- Signatures: Sending documents for signature via Documenso (with dev stub support)
- Tasks: Task Hub UI, task creation/updates, and reminders

---

## 1. Share Links from Builder/Vault

### 1.1 Create Share Link from Builder

1. Go to `/builder` and create a new document (or open an existing one).
2. Click **"Save to Vault"** to ensure the document is persisted.
3. After saving, look for a **"Share"** button or menu option.
4. Click **"Share"** and confirm:
   - A share link is generated
   - You can copy the link
   - The link format is `/share/[id]`

### 1.2 Create Share Link from Vault

1. Go to `/vault`.
2. Select a document from the list.
3. Click **"Share"** (or use the actions menu if available).
4. Confirm:
   - A share link is created successfully
   - The link can be copied
   - Share options (public/passcode) are available if implemented

### 1.3 Access Share Link

1. Copy a share link created from Builder or Vault.
2. Open the link in an incognito/private window (or different browser).
3. Confirm:
   - The share page loads (`/share/[id]`)
   - The document content is visible
   - If passcode is required, the passcode prompt appears
   - The document renders correctly (markdown converted to HTML)

### 1.4 Share Link Expiration (if implemented)

1. Create a share link with an expiration date.
2. Wait for expiration or manually set an expired date in the database.
3. Confirm:
   - Expired links show an appropriate error message
   - Active links continue to work

---

## 2. Send Documents for Signature

### 2.1 Send from Builder

1. Go to `/builder` and create or open a document.
2. Click **"Save to Vault"** first (signature requires a saved document).
3. Click **"Send for Signature"** button.
4. Fill in recipient details:
   - Recipient email
   - Recipient name
5. Click **"Send"** and confirm:
   - In development: A toast appears saying "Document sent for signature (dev stub)"
   - The modal closes
   - No errors appear in the browser console
   - In production: A real envelope is created in Documenso

### 2.2 Dev Stub Behavior

1. In development mode, send a document for signature.
2. Confirm:
   - The API returns HTTP 200 with `{ ok: true, envelopeId: "dev-stub-envelope-no-file" }`
   - A toast notification indicates it's a dev stub
   - No actual Documenso envelope is created
   - Console shows a warning about stub behavior

### 2.3 Signature Events in Activity

1. Send a document for signature (dev stub is fine for this test).
2. Go to `/activity`.
3. Confirm:
   - A `send_for_signature` event appears in the activity log
   - The event shows correct document and recipient information
   - Filtering by "Signatures" group shows the event

### 2.4 Signature Page

1. Go to `/signatures`.
2. Confirm:
   - The page loads without errors
   - Stats cards are visible (Pending, Completed, etc.)
   - "Send for Signature" button redirects to Workbench
   - Empty state is shown if no signatures exist
   - Responsive design works on mobile (375px width)

---

## 3. Task Hub v1

### 3.1 Task Hub Page

1. Go to `/tasks`.
2. Confirm:
   - The page loads without errors
   - Task Hub header and description are visible
   - Empty state is shown if no tasks exist
   - Task table/list is visible when tasks exist

### 3.2 Create Task

1. On the Task Hub page, find the **"Add New Task"** section.
2. Fill in:
   - Task title (required)
   - Due date (optional)
3. Click **"Add Task"** and confirm:
   - Task appears in the task list immediately
   - Task status is "open" by default
   - Task source is "manual"

### 3.3 Filter Tasks

1. Create several tasks with different:
   - Statuses (open/done)
   - Sources (manual/activity/mono)
2. Use the filters to confirm:
   - Status filter (All/Open/Done) works correctly
   - Source filter works correctly
   - Filters can be combined
   - Filtered results update immediately

### 3.4 Mark Task as Done

1. Find an open task in the Task Hub.
2. Click the checkbox in the task row.
3. Confirm:
   - Task status changes to "done" immediately
   - Task appears in "Completed" filter
   - Task row is visually updated (strikethrough, opacity, etc.)

### 3.5 Update Task Due Date

1. Find a task in the Task Hub.
2. Click the clock icon (or "Change due date" button).
3. Enter a new due date.
4. Confirm:
   - Due date updates immediately
   - Date is formatted correctly in the table
   - Overdue tasks are highlighted (if due date is in the past)

### 3.6 Task Statistics Cards

1. On the Task Hub page, check the statistics cards at the top.
2. Confirm:
   - "Open Tasks" count is correct
   - "Completed Tasks" count is correct
   - "Total Tasks" count is correct
   - "Overdue Tasks" count is correct (if any)
   - Cards update when tasks are created/updated

### 3.7 Responsive Design

1. Test Task Hub on a narrow viewport (375px width).
2. Confirm:
   - Table scrolls horizontally if needed
   - Buttons and inputs are appropriately sized
   - Text doesn't overflow
   - Filters wrap properly
   - Cards stack vertically on mobile

---

## 4. Task Reminders

### 4.1 Reminders on Task Hub

1. Create tasks with:
   - Due date today (status: open)
   - Due date yesterday (overdue, status: open)
   - Due date tomorrow (not shown)
2. Go to `/tasks`.
3. Confirm:
   - Reminders section shows tasks due today and overdue
   - Reminders are sorted (overdue first, then due today)
   - Maximum of 5 reminders are shown
   - Each reminder shows task title and due date

### 4.2 Reminders on Workbench

1. Create tasks with due dates today or overdue.
2. Go to `/workbench`.
3. Confirm:
   - Reminders section appears on the Workbench page
   - Same reminder logic as Task Hub (due today + overdue)
   - Reminders link to Task Hub and related documents

### 4.3 Reminder Links

1. In the Reminders section, click:
   - **"View Task"** link
   - **"View Doc"** link (if task has a related document)
2. Confirm:
   - "View Task" navigates to `/tasks`
   - "View Doc" navigates to `/vault` or document view
   - Links work correctly

### 4.4 No Reminders State

1. Ensure no tasks are due today or overdue.
2. Check Reminders section.
3. Confirm:
   - Shows a positive message ("No tasks due or overdue. Keep up the great work!")
   - Section uses a green/success color scheme

---

## 5. Cross-Page Navigation

### 5.1 Activity to Signatures

1. Go to `/activity`.
2. Filter by "Signatures" group.
3. Find a signature event.
4. Confirm:
   - Links to related document are available (if applicable)
   - Links to `/signatures` page are available (if applicable)
   - Navigation works correctly

### 5.2 Activity to Task Hub

1. Go to `/activity`.
2. Find an event that creates a task (if any).
3. Confirm:
   - Links to Task Hub are available (if applicable)
   - Navigation works correctly

---

## 6. Error Handling

### 6.1 Share Link Errors

1. Try to access an invalid share link (`/share/invalid-id`).
2. Confirm:
   - Error message is displayed
   - Error is user-friendly (not a stack trace)
   - Error suggests what might have gone wrong

### 6.2 Signature Errors

1. Try to send a document for signature without saving to Vault first.
2. Confirm:
   - Error message indicates document must be saved first
   - Error is clear and actionable
   - Toast notification shows the error

### 6.3 Task API Errors

1. Disconnect network (or cause an API error).
2. Try to create or update a task.
3. Confirm:
   - Error is caught and displayed
   - User receives feedback via toast
   - UI doesn't break or freeze

---

## 7. Definition of "done" for Week 12

- Share links can be created from Builder and Vault
- Share links are accessible and render documents correctly
- "Send for signature" works in Builder (with dev stub in development)
- Signature events appear in Activity log
- Task Hub page loads and displays tasks correctly
- Tasks can be created, updated, and filtered
- Task reminders appear on Task Hub and Workbench
- Reminders link to Task Hub and related documents
- Cross-page navigation links work correctly
- Responsive design works on mobile (375px width)
- Error handling provides clear feedback

At this point, Week 12 (Share, Signatures & Tasks v1) is considered functionally complete and ready for Week 13.

---

## 8. Known Limitations (v1)

The following are explicitly **out of scope for v1**:

- Google Tasks/Calendar sync
- Email notifications for task reminders
- Complex task assignment (tasks are org-scoped, not per-user)
- Task templates or recurring tasks
- Advanced task search
- Real Documenso integration in development (stub is used)
- Share link analytics (views, downloads)
- Signature completion webhooks (basic event logging only)

This v1 release focuses on:
- Basic task management (create, update, mark done)
- Simple reminders (due today, overdue)
- Share link creation and access
- Signature flow foundation (with dev stub)
- Cross-page navigation for discoverability

