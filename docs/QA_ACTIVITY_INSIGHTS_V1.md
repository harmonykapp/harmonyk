# QA – Activity & Insights v1

Version: v0.11.0  
Scope: Activity page with filters, Insights page with metrics, Activity API v1.

---

## 0. Pre-flight

Environment:

- App running locally on http://localhost:3000 with `npm run dev`

- Supabase project configured with `activity_log` table

- Env vars set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

Database:

- `activity_log` table exists with recent activity data (at least some events in the last 7 days for Insights to show metrics)

- RLS policies are configured (or service role is used for server-side queries)

---

## 1. Testing /activity page

### 1.1 Basic page load

1. Navigate to http://localhost:3000/activity

2. **Expected:**
   - Page title: "Activity"
   - Subtitle: "A single place to answer 'what just happened?' across docs, Maestro, connectors, and signatures."
   - "View insights" link in header
   - Filter section with:
     - Time range buttons (Last 24 hours, Last 7 days, Last 30 days)
     - Event group chips (Docs, Maestro, Connectors, Signatures, System)
     - Search input
   - Activity table with columns: When, Event, Source, Context
   - Events display in reverse chronological order (newest first)

### 1.2 Time range filters

1. Click "Last 24 hours" → verify only events from last 24h show

2. Click "Last 7 days" → verify events from last 7 days show

3. Click "Last 30 days" → verify events from last 30 days show

4. **Expected:** Table updates immediately, showing appropriate time range

### 1.3 Event group filters

1. Click "Docs" chip → verify only `doc_*` and `share_*` events show

2. Click "Maestro" chip → verify only `mono_*` events show

3. Click "Connectors" chip → verify:
   - Only `connector_*` events show
   - Provider filter appears below (All, Drive, Gmail)

4. Click "Signatures" chip → verify only `signature_*` events show

5. Click "System" chip → verify only `system_*` and `playbook_*` events show

6. Click multiple chips → verify events match any selected group (OR logic)

7. **Expected:** Filters work correctly, provider filter only shows when Connectors is selected

### 1.4 Provider filter (when Connectors selected)

1. Select "Connectors" chip

2. Click "Drive" → verify only Drive connector events show

3. Click "Gmail" → verify only Gmail connector events show

4. Click "All" → verify all connector events show

5. **Expected:** Provider filter works correctly

### 1.5 Search

1. Type a search term (e.g., part of an event type like "sync") → verify results filter

2. Clear search → verify all events show again

3. **Expected:** Search filters events by type field

### 1.6 Pagination

1. If there are more than 50 events, scroll to bottom

2. **Expected:** "Load more" button appears

3. Click "Load more" → verify more events append to the list

4. **Expected:** Cursor-based pagination works, new events append without replacing existing ones

### 1.7 Empty states

**Test case A: No events in time range**

1. Select "Last 24 hours" when no events exist in that range

2. **Expected:** Message: "No activity in this time range. Try selecting a longer time period or check back later."

**Test case B: No results for filters**

1. Select a specific event group that has no events (e.g., "Signatures" when no signature events exist)

2. **Expected:** Message: "No events match your current filters. Try adjusting your search or event groups."

### 1.8 Error state

1. Temporarily break the API (e.g., wrong Supabase URL) or check console for errors

2. **Expected:** Error banner shows: "Error loading activity" with error details

### 1.9 Mobile/narrow width

1. Resize browser to 375px width (mobile)

2. **Expected:**
   - Time range buttons wrap properly
   - Event group chips wrap properly
   - Table scrolls horizontally if needed
   - No layout breaks or overflow issues

---

## 2. Testing /insights page

### 2.1 Basic page load

1. Navigate to http://localhost:3000/insights

2. **Expected:**
   - Page title: "Insights"
   - Subtitle: "Simple metrics that prove Harmonyk is doing work for you (and that connectors are alive)."
   - 4-5 metric tiles showing:
     - Docs created (7d)
     - Maestro questions (7d)
     - Connector syncs (7d) [with provider breakdown if available]
     - Signatures completed (7d)
     - Active docs (7d) [only if > 0]
   - Recent trends table with 7 days of data

### 2.2 Metric tiles

1. Verify all tiles show numbers (can be 0)

2. Verify tiles have consistent height

3. Click on a tile → verify:
   - Navigates to /activity with appropriate filter (e.g., Docs tile → /activity?groups=docs)
   - Telemetry event fires (check console for `insights_tile_clicked`)

4. **Expected:** Tiles are clickable, navigate correctly, and track telemetry

### 2.3 Recent trends table

1. Verify table shows 7 rows (one per day)

2. Verify columns: Day, Docs, Maestro, Syncs, Signatures

3. Verify dates are formatted correctly (e.g., "Nov 27")

4. Verify numbers are accurate (match what you see in Activity page)

5. **Expected:** Table displays correctly with accurate daily counts

### 2.4 Empty state

1. If there's no activity in the last 7 days:

2. **Expected:** Message: "Not enough activity yet – plug in a connector or create a doc."

### 2.5 Error state

1. Temporarily break the metrics computation (e.g., wrong Supabase URL)

2. **Expected:** Error banner shows: "Error loading insights" with error details

### 2.6 Responsive design

1. Resize browser to 375px width (mobile)

2. **Expected:**
   - Tiles stack in single column
   - Table scrolls horizontally if needed
   - No layout breaks

---

## 3. Edge cases

### 3.1 No activity at all

**Setup:** Ensure `activity_log` has no events in the last 7 days

1. Visit /activity → **Expected:** Empty state message

2. Visit /insights → **Expected:** Empty state message

### 3.2 Only connector events

**Setup:** Ensure only `connector_*` events exist

1. Visit /activity → **Expected:** Only connector events show

2. Visit /insights → **Expected:**
   - Connector syncs tile shows count
   - Other tiles show 0
   - Trends table shows connector syncs only

### 3.3 Only Maestro/doc events

**Setup:** Ensure only `mono_*` and `doc_*` events exist

1. Visit /activity → **Expected:** Only Maestro and Docs events show

2. Visit /insights → **Expected:**
   - Docs created and Maestro questions tiles show counts
   - Connector syncs and Signatures tiles show 0
   - Trends table shows appropriate counts

### 3.4 Very high numbers

**Setup:** Ensure there are many events (100+)

1. Visit /activity → **Expected:** Pagination works, "Load more" appears

2. Visit /insights → **Expected:** Large numbers display correctly (no overflow)

### 3.5 Long event type names

**Setup:** Ensure events with long type names exist

1. Visit /activity → **Expected:** Long names truncate with ellipsis, full name in tooltip

---

## 4. Cross-page navigation

### 4.1 From /integrations

1. Visit /integrations

2. Click "View connector activity" button

3. **Expected:** Navigates to /activity?groups=connectors

### 4.2 From /vault

1. Visit /vault

2. Click "View activity" button in header

3. **Expected:** Navigates to /activity

### 4.3 From /builder

1. Visit /builder

2. Click "View activity" button in templates sidebar

3. **Expected:** Navigates to /activity

### 4.4 From /activity to /insights

1. Visit /activity

2. Click "View insights" link in header

3. **Expected:** Navigates to /insights

### 4.5 From /insights tiles

1. Visit /insights

2. Click any metric tile

3. **Expected:** Navigates to /activity with appropriate filter applied

---

## 5. Telemetry verification

### 5.1 Activity page

1. Open browser console (F12)

2. Visit /activity → **Expected:** `activity_page_view` event fires

3. Change a filter (chip or time range) → **Expected:** `activity_filters_changed` event fires

4. Type in search and submit → **Expected:** `activity_search_submitted` event fires

### 5.2 Insights page

1. Open browser console (F12)

2. Visit /insights → **Expected:** `insights_page_view` event fires

3. Click a metric tile → **Expected:** `insights_tile_clicked` event fires with tile name and value

---

## 6. Performance checks

1. Visit /activity → **Expected:** Page loads within 2-3 seconds

2. Visit /insights → **Expected:** Page loads within 2-3 seconds

3. Change filters multiple times → **Expected:** No noticeable lag or freezing

4. Click "Load more" → **Expected:** New events load smoothly

---

## 7. Known limitations (v1)

- No advanced filtering by arbitrary metadata keys

- No per-user breakdowns

- No time-series charts (just simple table)

- No cross-org analytics

- Search only works on event type, not full-text on document names

- Provider breakdown in Insights is limited to what's in the database

---

## 8. Regression checks

Verify these existing features still work:

- [ ] Other pages (Dashboard, Workbench, Builder, Vault) still load

- [ ] Existing API endpoints still work

- [ ] No console errors on other pages

- [ ] Navigation between pages works

---

## 9. Sign-off

- [ ] All /activity tests pass

- [ ] All /insights tests pass

- [ ] Edge cases handled correctly

- [ ] Cross-page navigation works

- [ ] Telemetry events fire correctly

- [ ] Mobile responsiveness verified

- [ ] No regressions in other features

**Tester:** _________________  
**Date:** _________________  
**Status:** ☐ Pass  ☐ Fail  ☐ Needs work

