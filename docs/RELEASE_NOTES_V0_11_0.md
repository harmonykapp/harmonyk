# v0.11.0 – Activity & Insights v1

Status: Local dev  
Scope: Activity page with filters, Insights page with metrics, Activity API v1.

---

## Overview

Harmonyk v0.11.0 introduces **Activity & Insights v1**:

- New **/activity** page as a single place to answer "what just happened?" across docs, Maestro, connectors, and signatures

- New **/insights** page showing 3–5 simple metrics that prove Harmonyk is doing work for you

- New **Activity API v1** (`GET /api/activity`) with flexible filtering and cursor-based pagination

- Telemetry tracking for Activity and Insights usage

- Cross-page navigation links for better discoverability

This is a **v1 release** designed to be small, reliable, and useful for a single founder / small team, not a full analytics dashboard.

---

## New features

### 1. Activity page (`/activity`)

A single place to answer "what just happened?" across all Harmonyk activity.

**Filters:**

- **Time range presets:** Last 24 hours, Last 7 days, Last 30 days

- **Event groups (chips):**
  - Docs – all `doc_*` and `share_*` events
  - Maestro – all `mono_*` events
  - Connectors – all `connector_*` events
  - Signatures – all `signature_*` events
  - System – all `system_*` and `playbook_*` events

- **Provider filter:** When Connectors chip is selected, filter by Drive or Gmail

- **Search:** Simple text search over event types

**Features:**

- Cursor-based pagination with "Load more" button

- Humanized event type display (e.g., "Connector Sync Completed")

- Responsive design for mobile and narrow widths

- Clear empty states for no events or no filter matches

- Error handling with user-friendly messages

### 2. Insights page (`/insights`)

Simple metrics that prove Harmonyk is doing work for you (and that connectors are alive).

**Metric tiles (last 7 days):**

1. **Docs created** – Count of unique documents created
2. **Maestro questions** – Count of Maestro queries/actions
3. **Connector syncs** – Count of connector sync completions (with provider breakdown)
4. **Signatures completed** – Count of completed signature events
5. **Active docs** (optional) – Count of unique documents with activity

**Recent trends table:**

- Daily breakdown for the last 7 days
- Columns: Day, Docs created, Maestro questions, Connector syncs, Signatures completed
- Simple text table (no charts in v1)

**Features:**

- Clickable tiles that navigate to filtered Activity page

- Responsive grid layout (1 column mobile, 2 tablet, 4 desktop)

- Consistent tile heights for visual alignment

- Empty state when no activity exists

### 3. Activity API v1 (`GET /api/activity`)

New RESTful API endpoint for querying activity_log.

**Query parameters:**

- `from` – ISO timestamp (inclusive)
- `to` – ISO timestamp (inclusive)
- `groups` – Comma-separated event groups (docs, mono, connectors, signatures, system)
- `group` – Repeated parameter alternative (e.g., `?group=docs&group=mono`)
- `provider` – Connector provider filter (e.g., "google_drive", "gmail")
- `search` – Simple text search over event type
- `limit` – Number of results (default 50, max 100)
- `cursor` – Created_at cursor for pagination (exclusive)

**Response:**

```json
{
  "data": [...activity_log rows...],
  "nextCursor": "ISO timestamp" | null
}
```

**Features:**

- Flexible filtering by event groups, provider, time range, and search

- Cursor-based pagination for efficient loading

- Safe limit clamping (1–100)

- RLS-based org scoping (relies on database policies)

### 4. Telemetry

Activity and Insights usage tracking via PostHog:

- `activity_page_view` – Fired when Activity page loads
- `activity_filters_changed` – Fired when filters change
- `activity_search_submitted` – Fired when search is used
- `insights_page_view` – Fired when Insights page loads
- `insights_tile_clicked` – Fired when a metric tile is clicked

### 5. Cross-page navigation

Added navigation links for better discoverability:

- From `/integrations`: "View connector activity" → `/activity?groups=connectors`
- From `/vault`: "View activity" → `/activity`
- From `/builder`: "View activity" → `/activity`
- From `/activity`: "View insights" → `/insights`
- From `/insights`: Clickable tiles → `/activity` with appropriate filters

---

## Technical changes

### New files

- `lib/activity-queries.ts` – Helper for building activity_log queries
- `lib/activity-insights.ts` – Helper for computing Insights metrics
- `app/api/activity/route.ts` – Activity API v1 endpoint
- `app/(protected)/activity/_components/activity-client.tsx` – Activity UI v1
- `app/(protected)/insights/_components/insights-client-v1.tsx` – Insights UI v1
- `docs/ACTIVITY_INSIGHTS_V1.md` – Internal spec for Activity & Insights v1
- `docs/QA_ACTIVITY_INSIGHTS_V1.md` – QA testing guide

### Updated files

- `app/(protected)/activity/page.tsx` – Updated to use new ActivityClient
- `app/(protected)/insights/page.tsx` – Updated to use new InsightsClientV1
- `app/integrations/page.tsx` – Added "View connector activity" link
- `app/(protected)/vault/page.tsx` – Added "View activity" link
- `components/builder/builder-client.tsx` – Added "View activity" link
- `docs/ACTIVITY_EVENTS.md` – Added "See also" section linking to spec

---

## Known limitations (v1)

The following are explicitly **out of scope for v1**:

- Complex time-series charts or sparklines on /insights
- Per-user breakdowns (e.g., "top users by activity")
- Advanced filtering by arbitrary metadata keys
- Cross-org / cross-tenant analytics
- Machine learning or anomaly detection on activity_log
- Full-text search over document names (search only works on event types)
- Custom time ranges in UI (only presets: 24h, 7d, 30d)

We only want:

- A reliable Activity API with filters (time range, event groups, connector provider, simple search)
- A useful /activity page wired to that API
- A small /insights page with a handful of trustworthy counts over the last 7 days

---

## Future v2 considerations

Potential enhancements for a future v2 release:

- Time-series charts on Insights (sparklines, line charts)
- Per-user activity breakdowns
- Advanced search with full-text over document metadata
- Custom time range picker in Activity UI
- Export Activity data to CSV
- Real-time activity updates (WebSocket or polling)
- Activity event details modal/expandable rows
- More granular Insights metrics (e.g., by document type, by connector)

---

## Migration notes

**No database migrations required** – this release uses the existing `activity_log` table.

**No breaking changes** – existing Activity-related code continues to work. The new `/api/activity` endpoint is additive.

**RLS policies** – Activity API and Insights helper rely on Row Level Security policies for org scoping. Ensure RLS is properly configured in your Supabase project.

---

## Testing

See `docs/QA_ACTIVITY_INSIGHTS_V1.md` for comprehensive testing instructions.

**Quick smoke test:**

1. Visit `/activity` → verify page loads and shows events
2. Apply filters → verify results update
3. Visit `/insights` → verify metrics display
4. Click a tile → verify navigation to Activity page
5. Test on mobile (375px width) → verify responsive design

---

## Dependencies

No new external dependencies added. Uses existing:

- PostHog for telemetry (`lib/posthog-client.ts`)
- Supabase client (`lib/supabase-server.ts`)
- Next.js App Router

---

## Changelog

### Added

- Activity page with filters, pagination, and search
- Insights page with metric tiles and trends table
- Activity API v1 (`GET /api/activity`)
- Telemetry tracking for Activity and Insights
- Cross-page navigation links
- Internal spec document (`docs/ACTIVITY_INSIGHTS_V1.md`)
- QA testing guide (`docs/QA_ACTIVITY_INSIGHTS_V1.md`)

### Changed

- Activity page now uses new API and filter model
- Insights page now uses new metrics computation
- Updated page descriptions to match spec language

### Fixed

- Date formatting hydration mismatch (moved to server-side)
- Mobile responsiveness for tables and chips
- Empty state messages for better user guidance

---

**Release date:** 2025-11-27  
**Version:** v0.11.0  
**Tag:** `v0.11.0-activity-insights-v1`

