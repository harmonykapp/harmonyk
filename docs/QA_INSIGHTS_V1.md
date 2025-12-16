# QA Checklist – Insights & Activity v1 (Week 8)

Scope:
- `/activity` – Activity timeline, filters, error handling, CSV export
- `/insights` – Summary metrics, time-saved, docs-in-Vault, CSV export
- Underlying APIs: `/api/activity/query`, `/api/activity/export`,
  `/api/insights/summary`, `/api/insights/export`

> Goal: Prove that ActivityLog + Insights form a coherent telemetry layer for
> the MVP. No flaky filters, no silent failures, and CSV exports usable for
> debugging and reporting.

---

## 1. Pre-flight

- [ ] Confirm `npm run dev` builds cleanly.
- [ ] Confirm you can sign in as a test user and reach:
  - [ ] `/activity`
  - [ ] `/insights`
- [ ] Confirm at least one workspace exists with a handful of documents and
      activity (generate, save to Vault, share).

If there is no recent activity:

- [ ] Generate 3–5 documents via Builder.
- [ ] Save them to Vault.
- [ ] Create at least one share link and (if possible) one signature flow.
- [ ] Trigger at least one Playbook run that logs `playbook_run_completed` with
      `time_saved_seconds` in its payload.

---

## 2. /activity – Basic load & empty state

1. Navigate to `/activity` for a workspace with **some** activity:

   - [ ] Page loads without errors in the browser console.
   - [ ] Activity header shows a non-zero count of events.

2. Navigate to `/activity` for a **fresh** workspace (or one where you clear
   ActivityLog in Supabase):

   - [ ] Page shows a friendly "No activity yet" style message.
   - [ ] No runtime errors in console.

3. Force an error in `/api/activity/query` (e.g. temporarily break Supabase
   credentials or column name in a local branch):

   - [ ] `/activity` shows an error message, not a blank screen.
   - [ ] Error text is understandable to a non-technical user (no raw SQL dumps).

---

## 3. /activity – Filters

### 3.1 Date presets

- [ ] Switch between **Last 7 days**, **Last 30 days**, and **All time**:
  - Event list visibly changes where expected.
  - No duplicate or obviously missing events across switches.

- [ ] Set **Custom** date range with:
  - [ ] `from` and `to` within last few days – list updates.
  - [ ] `from` > `to` – UI shouldn't crash; list can be empty but no errors.

### 3.2 Event type chips

- [ ] Click a single chip (e.g. "Docs generated") – only events of that type
      appear.
- [ ] Select multiple chips – list shows a union of events.
- [ ] Clear all chips – all event types return.

### 3.3 Search

- [ ] Enter part of a known document/file name – only matching events remain.
- [ ] Clear search – list returns to full filtered set.

### 3.4 Error-only toggle

- [ ] With a mix of success/error events in ActivityLog, enable **Only errors**:
  - List shows only events with a non-null `error` payload.
  - UI indicates clearly that we're in "error-only" mode.

- [ ] Turn off **Only errors**:
  - List returns to the full filtered set.

---

## 4. /activity – CSV export

With a few dozen events in the current filtered view:

- [ ] Click **Export CSV**.
- [ ] Browser downloads `activity_export.csv`.
- [ ] Open CSV in a spreadsheet viewer:
  - [ ] Columns exist for: `id`, `created_at`, `workspace_id`, `owner_id`,
        `document_id`, `share_link_id`, `playbook_run_id`, `connector_id`,
        `event_type`, `event_label`, `source`, `payload`, `error`.
  - [ ] At least several rows match what you see on-screen in `/activity`.
  - [ ] UTF-8 encoding looks correct (no mojibake).

- [ ] Apply different filters (date, event types, search) and re-export:
  - [ ] Row count in CSV roughly matches the visible event count.

---

## 5. /insights – Basic load & empty state

1. Navigate to `/insights` for a workspace with activity:

   - [ ] Summary cards render (Docs generated, Docs saved to Vault, etc.).
   - [ ] Time-saved card shows non-zero hours if any playbook runs logged
         `time_saved_seconds`.

2. Navigate to `/insights` for a fresh workspace:

   - [ ] Empty-state message appears explaining that more usage is needed.
   - [ ] No errors thrown.

3. Force an error in `/api/insights/summary`:

   - [ ] `/insights` shows a friendly error message.
   - [ ] No broken layout.

---

## 6. /insights – Range & metrics sanity

### 6.1 Range switching

- [ ] Toggle between **Last 7 days** and **Last 30 days**:
  - Cards update their values.
  - The date range label (from → to) changes accordingly.

### 6.2 Metrics validation

- [ ] Compare Insights card numbers to:
  - Raw counts you see on `/activity` for the same window.
  - A quick manual query in Supabase on `activity_log` (e.g. count `generate`
    events for workspace).

For each of these for 7d and 30d:

- [ ] Docs generated
- [ ] Docs saved to Vault
- [ ] Share links created
- [ ] Signatures sent
- [ ] Signatures completed
- [ ] Playbook runs
- [ ] Maestro queries
- [ ] Time saved (seconds → hours)

### 6.3 Docs in Vault total

- [ ] Confirm `docsInVaultTotal` roughly matches the count from:
  - Vault UI document list, or
  - A Supabase query on the Vault/documents table.

---

## 7. /insights – CSV export

- [ ] Click **Export CSV** on `/insights`.
- [ ] Browser downloads `insights_export.csv`.
- [ ] Open CSV and confirm:
  - `metric`, `window`, and `value` columns exist.
  - Rows exist for each metric (docs generated, docs saved, share links, etc.).

---

## 8. Mobile / narrow viewport sanity checks

- [ ] `/activity` on narrow viewport (e.g. iPhone size):
  - Filter chips wrap correctly.
  - Table horizontally scrolls instead of overflowing.
  - No clipped text or overlapping elements.

- [ ] `/insights` on narrow viewport:
  - Cards stack in a single column.
  - Range switcher and CSV button remain visible and usable.

---

## 9. Regression checks

- [ ] Generate → Save to Vault → Share flow still works end-to-end.
- [ ] Playbook runs still log time-saved data and don't break `/workbench`.
- [ ] No new TypeScript errors in `npm run build`.

If any regressions appear, log them in the issue tracker under
`Week 8 – Insights & Activity v1` with repro steps.

