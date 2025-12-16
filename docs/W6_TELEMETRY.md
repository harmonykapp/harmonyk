# Week 6 – Telemetry & Logging

This document summarizes the telemetry and structured logging added in Week 6 for the Harmonyk Beta build.

---

## Server-side telemetry helper

- File: `lib/telemetry-server.ts`

- Exports:

  - `logServerEvent(event)`

  - `logServerError(event)`

- Behavior:

  - Logs structured JSON-like objects via `console.info` / `console.error` with label prefixes:

    - `[telemetry:event]`

    - `[telemetry:error]`

  - Fields captured:

    - `event` (string)

    - `userId`, `orgId`, `docId`

    - `source` (e.g. workbench, builder, vault, mono, activity)

    - `route`

    - `durationMs`

    - `properties` (small, non-sensitive metadata)

    - `timestamp`

- No external dependencies are used for Beta. The helper is designed so a real telemetry SDK (PostHog/Sentry/etc.) can later be plugged in behind the same interface.

---

## Instrumented API routes

The following backend routes now call `logServerEvent` / `logServerError`:

- **Workbench Analyze**

  - Event: `workbench_analyze`

  - Source: `workbench`

  - Data: `userId`, `orgId`, `docId` (when available), `route`, `durationMs`, status in `properties`.

- **Builder Generate**

  - Event: `builder_generate`

  - Source: `builder`

  - Similar fields as above.

- **Vault Save**

  - Event: `vault_save`

  - Source: `vault`

  - Captures which unified item / document is being saved.

- **Mono Chat**

  - Event: `mono_chat`

  - Source: `mono`

  - Does not log prompt content; only high-level metadata such as route and status.

- **Activity List/Load**

  - Event: `activity_list`

  - Source: `activity`

  - Captures the fact that the Activity page is loading a set of events.

Errors in these routes are recorded via `logServerError` with the same metadata plus a sanitized `error` object.

---

## Activity Log metadata

- The central activity logging helper now includes:

  - `userId` / `orgId`

  - `docId` (unified item or document where applicable)

  - `action` or `event_type`

  - `source` (e.g. workbench, builder, vault, mono)

  - Optional metadata (JSON) with:

    - `trigger_route`

    - `duration_ms` (if measured)

- After successful inserts, an additional `activity_log_write` server telemetry event is recorded with high-level info and no sensitive content.

---

## Health / Diagnostics

- API route: `GET /api/health`

  - Returns `{ ok: true, timestamp, env }` if the API layer is reachable.

  - Used for simple liveness checks.

- Page: `/dev/health`

  - Shows:

    - App version (`NEXT_PUBLIC_APP_VERSION` or Vercel commit SHA, with `dev-local` fallback)

    - `NODE_ENV`

    - `NEXT_PUBLIC_SUPABASE_URL` (if set)

    - Result of `/api/health` call

    - Current feature flag states from `getFeatureFlags()`

  - Intended only for internal use by logged-in team members during Beta.

---

## Beta Notes

- Server-side telemetry is intentionally minimal and console-based for the Beta phase.

- No user document content or large payloads are logged, only IDs and coarse metadata.

- These helpers and events provide enough information to debug golden-path issues and will be a foundation for a richer telemetry stack (PostHog/Sentry/etc.) in later weeks.

