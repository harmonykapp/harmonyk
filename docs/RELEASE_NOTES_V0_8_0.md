# Release Notes – v0.8.0

> Harmonyk – Insights & Activity v1

Target: end of Week 8 on the 18-week roadmap.

---

## Highlights

- **New telemetry layer** powered by `activity_log` and Playbooks data.

- **/activity** page upgraded to support:
  - Date-range presets + custom ranges.
  - Event-type chips (generate, analyze, save_to_vault, shares, signatures, playbooks, Mono, connectors).
  - Error-only filtering.
  - Simple search by file name / document title.
  - CSV export of raw events for debugging and light analysis.

- **/insights** page upgraded to show:
  - Docs generated and saved to Vault.
  - Share links created.
  - Signatures sent/completed.
  - Playbook runs.
  - Mono queries.
  - Time saved (via Playbooks).
  - Total docs in Vault.
  - CSV export of summary metrics.

---

## New APIs

- `POST /api/activity/query`
  - Query filtered ActivityLog rows for a given workspace/owner.
  - Shared by `/activity`, CSV export, and any admin tooling.

- `POST /api/activity/export`
  - Export CSV of raw `activity_log` events.
  - Respects the same filters as `/api/activity/query`.

- `POST /api/insights/summary`
  - Aggregate key metrics for the last 7/30 days based on ActivityLog.

- `POST /api/insights/export`
  - Export CSV of high-level Insights metrics.

---

## Developer-facing changes

- Canonical event catalog defined in `docs/ACTIVITY_EVENTS.md`.

- Event type constants and labels centralized in `lib/activity-events.ts`.

- Reusable Activity query helper in `lib/activity-log.ts`:
  - `buildActivityLogQuery` and `fetchActivityLog`.

- Reusable Activity filter model in `lib/activity-filters.ts`:
  - `parseActivityFiltersFromSearch`
  - `serializeActivityFiltersToQuery`
  - `toActivityQueryFilters`

- New client components:
  - `app/(protected)/activity/_components/activity-client.tsx`
  - `app/(protected)/insights/_components/insights-client.tsx`

---

## Known limitations (v1)

- No per-metric trend charts yet (just counts).
- No per-user breakdown; all metrics are per-workspace (with optional owner filter).
- Time-saved estimates depend entirely on Playbooks logging `time_saved_seconds`
  in a consistent way.
- Vault doc counts are a basic total; no breakdown by type/folder.

---

## Next steps (Weeks 9–10+)

- Harden connectors telemetry (Drive/Gmail) once Connectors v1 ships.
- Add simple charts (spark-lines, trend arrows) to the `/insights` page.
- Integrate Insights with onboarding ("you saved X hours this week" nudge).
- Surface key Insights in Mono / Workbench so the AI feels more "situationally aware".

