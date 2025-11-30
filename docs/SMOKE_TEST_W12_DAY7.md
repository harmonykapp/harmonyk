# Manual Smoke Test – Week 12 Day 7

This is a quick manual pass to verify Week 12 features before tagging v0.12.0.

**Estimated time:** 10-15 minutes

---

## Prerequisites

1. Start the dev server: `npm run dev`
2. Ensure you have:
   - At least one document saved in Vault
   - Browser dev tools console open (F12)

---

## 1. Task Hub (`/tasks`)

### Test: Create and manage tasks

1. Navigate to `/tasks`
2. Verify:
   - ✅ Page loads without errors
   - ✅ Empty state shows if no tasks exist
   - ✅ "Add New Task" section is visible
3. Create a task:
   - Enter title: "Test Task 1"
   - Leave due date empty
   - Click "Add Task"
   - ✅ Task appears in the list immediately
4. Create another task:
   - Enter title: "Task Due Today"
   - Set due date to today
   - Click "Add Task"
   - ✅ Task appears with today's date
5. Mark a task as done:
   - Click checkbox on "Test Task 1"
   - ✅ Task status changes to "done"
   - ✅ Task appears with strikethrough/opacity
6. Test filters:
   - Select "Open" filter
   - ✅ Only open tasks show
   - Select "All" filter
   - ✅ All tasks show

### Test: Task statistics

1. Check the statistics cards at the top of Task Hub
2. Verify:
   - ✅ "Open Tasks" count is correct
   - ✅ "Completed Tasks" count is correct
   - ✅ "Total Tasks" count is correct
   - ✅ "Overdue Tasks" shows 0 (or correct count)

### Test: Responsive design

1. Resize browser to 375px width (or use mobile emulation)
2. Verify:
   - ✅ Table scrolls horizontally if needed
   - ✅ Buttons and inputs are appropriately sized
   - ✅ Filters wrap properly
   - ✅ Cards stack vertically

---

## 2. Task Reminders

### Test: Reminders on Task Hub

1. Create a task with due date = today (status: open)
2. Create another task with due date = yesterday (overdue, status: open)
3. Go to `/tasks`
4. Verify:
   - ✅ Reminders section appears above task list
   - ✅ Shows tasks due today and overdue
   - ✅ Overdue tasks are shown first
   - ✅ Each reminder shows task title and due date
   - ✅ "View Task" link is present

### Test: Reminders on Workbench

1. Ensure you have tasks due today or overdue
2. Navigate to `/workbench`
3. Verify:
   - ✅ Reminders section appears below "Drive Recent"
   - ✅ Shows same reminders as Task Hub
   - ✅ Links work ("View Task", "View All Tasks")

### Test: No reminders state

1. Mark all due/overdue tasks as done
2. Verify:
   - ✅ Reminders section shows positive message
   - ✅ Green/success color scheme

---

## 3. Signatures (`/signatures`)

### Test: Signatures page

1. Navigate to `/signatures`
2. Verify:
   - ✅ Page loads without errors
   - ✅ Stats cards are visible (Pending, Completed, etc.)
   - ✅ "Send for Signature" button is present
   - ✅ Empty state message is shown if no signatures

### Test: Send for signature from Builder

1. Navigate to `/builder`
2. Create or open a document
3. Click **"Save to Vault"** first
4. Wait for success confirmation
5. Click **"Send for Signature"** button
6. Fill in:
   - Recipient email: `test@example.com`
   - Recipient name: `Test User`
7. Click "Send"
8. Verify:
   - ✅ Toast notification appears (in dev: "Document sent for signature (dev stub)")
   - ✅ Modal closes
   - ✅ No errors in browser console
   - ✅ No errors in terminal/server logs

### Test: Signature event in Activity

1. After sending for signature, navigate to `/activity`
2. Verify:
   - ✅ `send_for_signature` event appears in activity log
   - ✅ Event shows correct document information
   - ✅ Filtering by "Signatures" group shows the event

### Test: Cross-page links from Activity

1. In `/activity`, find a signature event
2. Verify:
   - ✅ "View Doc" link appears (if document_id present)
   - ✅ "View Signatures" link appears (for signature events)
   - ✅ Links navigate correctly

### Test: Responsive design

1. Resize browser to 375px width
2. Verify:
   - ✅ Stats cards stack properly
   - ✅ Button sizes are appropriate
   - ✅ No horizontal overflow

---

## 4. Share Links

### Test: Create share link from Vault

1. Navigate to `/vault`
2. Select a document from the list
3. Look for "Share" button or action menu
4. If available, create a share link
5. Verify:
   - ✅ Share link is generated
   - ✅ Link can be copied

### Test: Access share link

1. Copy a share link (or navigate to `/share/[some-id]`)
2. Open in incognito/private window
3. Verify:
   - ✅ Share page loads (`/share/[id]`)
   - ✅ Document content is visible
   - ✅ Document renders correctly

---

## 5. Workbench

### Test: Reminders on Workbench

1. Navigate to `/workbench`
2. Verify:
   - ✅ Task Reminders section is visible
   - ✅ Reminders show correctly (if any exist)
   - ✅ Links work

---

## 6. Activity (`/activity`)

### Test: Activity page loads

1. Navigate to `/activity`
2. Verify:
   - ✅ Page loads without errors
   - ✅ Events are displayed
   - ✅ Filters work
   - ✅ Cross-page links appear for signature events

---

## 7. Insights (`/insights`)

### Test: Insights page loads

1. Navigate to `/insights`
2. Verify:
   - ✅ Page loads without errors
   - ✅ Metric tiles display
   - ✅ No console errors

---

## 8. Error handling

### Test: Signature error handling

1. Try to send a document for signature without saving to Vault first
2. Verify:
   - ✅ Error message appears (or button is disabled)
   - ✅ Error is clear and actionable

### Test: Task API errors

1. Create a task with invalid data (if possible)
2. Verify:
   - ✅ Error is caught and displayed
   - ✅ Toast notification shows error
   - ✅ UI doesn't break

---

## Checklist Summary

After completing all tests, verify:

- [ ] Task Hub loads and displays tasks correctly
- [ ] Tasks can be created, updated, and marked as done
- [ ] Task filters work (status, source)
- [ ] Task reminders appear on Task Hub and Workbench
- [ ] Reminder links navigate correctly
- [ ] Signatures page loads without errors
- [ ] "Send for signature" works from Builder (with dev stub)
- [ ] Signature events appear in Activity log
- [ ] Cross-page navigation links work
- [ ] Responsive design works on mobile (375px)
- [ ] No console errors during any test
- [ ] No server/terminal errors during any test

---

## If anything fails

1. Check browser console for errors
2. Check terminal/server logs for errors
3. Note the exact steps that failed
4. Take screenshots if helpful
5. Report the failure before proceeding with commit/tag

---

## Next steps (after all tests pass)

1. Commit changes:
   ```bash
   git add .
   git commit -m "v0.12.0 – Signatures fix + Task Hub & Notifications v1"
   ```

2. Tag the release:
   ```bash
   git tag v0.12.0-task-hub-notifications-v1
   ```

3. Update package.json version to 0.12.0 (if not already done)

