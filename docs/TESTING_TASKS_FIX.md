# Testing Tasks Schema Fix

This document provides a quick test checklist to verify that the tasks schema repair migration has been successfully applied.

## Pre-Test Checklist

- [x] Migration `202511281040_tasks_schema_repair.sql` has been run in Supabase SQL Editor
- [ ] Dev server is running (`npm run dev`)
- [ ] You are logged into the application

## Test Steps

### 1. Load Tasks Page

1. Navigate to `/tasks` in your browser
2. **Expected Result:**
   - Page loads without errors
   - No red error card at the top
   - You see:
     - Task Hub header
     - Task count cards (Open: 0, Completed: 0, Total: 0, Overdue: 0)
     - "Add New Task" card
     - Empty task list with "No tasks yet" message

### 2. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. **Expected Result:**
   - No error messages about "table not found" or "column does not exist"
   - No `[TasksPage] Failed to fetch tasks` errors
   - Optional: You might see a successful API call log

### 3. Create a Test Task

1. In the "Add New Task" card:
   - Enter task title: "Test Task - Schema Fix"
   - Optionally set a due date (e.g., today or tomorrow)
   - Click "Add Task"
2. **Expected Result:**
   - Toast notification: "Task created successfully"
   - Task appears in the task list immediately
   - Open Tasks count increases to 1
   - Total Tasks count increases to 1

### 4. Verify Task Persistence

1. Refresh the page (F5)
2. **Expected Result:**
   - The task you created still appears
   - Task counts are correct
   - No errors on page load

### 5. Test Task Status Toggle

1. Find your test task in the list
2. Click the checkbox in the first column
3. **Expected Result:**
   - Task status changes to "done"
   - Task is visually struck through/faded
   - Open Tasks count decreases to 0
   - Completed Tasks count increases to 1

### 6. Test Task Filters

1. Use the Status filter dropdown:
   - Select "Open" → Should show only open tasks
   - Select "Done" → Should show only done tasks
   - Select "All" → Should show all tasks
2. **Expected Result:**
   - Task list updates correctly for each filter
   - Task counts update appropriately

### 7. Test Task Reminders Component

1. Create a new task with due date set to yesterday (overdue)
2. Navigate to `/workbench`
3. **Expected Result:**
   - "Reminders" card appears below "Drive Recent"
   - Your overdue task is listed in the Reminders card
   - Overdue task has visual highlighting (red border/badge)

### 8. Verify API Endpoint Directly (Optional)

1. Open browser DevTools → Network tab
2. Navigate to `/tasks`
3. Find the request to `/api/tasks`
4. **Expected Result:**
   - Status: 200 OK
   - Response body: `{ "tasks": [...] }` with your tasks listed

## Success Criteria

✅ All tests pass without errors
✅ Tasks can be created, updated, and filtered
✅ Task data persists across page refreshes
✅ No console errors related to database schema
✅ Task Reminders component works correctly

## If Tests Fail

If any test fails:

1. **Check Supabase Migration:**
   - Go to Supabase Dashboard → Database → Tables
   - Verify `tasks` table exists
   - Verify table has `org_id` column

2. **Check Browser Console:**
   - Look for specific error messages
   - Note the error code (e.g., 42P01, 42703)

3. **Check Server Logs:**
   - Look at the terminal where `npm run dev` is running
   - Check for database errors

4. **Verify Migration Ran:**
   - In Supabase Dashboard → SQL Editor
   - Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position;`
   - Should show: `id`, `org_id`, `user_id`, `source`, `title`, `status`, `due_at`, `doc_id`, `activity_id`, `created_at`, `updated_at`

## Rollback (If Needed)

If you need to rollback the migration:

```sql
DROP TABLE IF EXISTS public.tasks CASCADE;
```

Then re-run the repair migration if needed.

