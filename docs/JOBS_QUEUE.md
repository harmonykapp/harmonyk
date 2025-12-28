# JOBS_QUEUE — Harmonyk (PG-W1 Day 3)

Design notes for the background jobs / queue system that will power
async work in Harmonyk (dev-only foundation for now).

This is intentionally simple but production-leaning: a single `jobs`
table with a small helper library and a dev tick endpoint.

---

## 1. Table shape (spec for Supabase migration)

**Table:** `public.jobs`

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `type text not null`
- `org_id uuid null`
- `payload jsonb not null default '{}'::jsonb`
- `status text not null default 'queued'`
- `attempts integer not null default 0`
- `next_run_at timestamptz null`
- `last_error text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended indexes:

- `idx_jobs_status_next_run_at` on `(status, next_run_at)`
- `idx_jobs_type_status` on `(type, status)`

**Status enum (logical):**

- `queued` — ready to run (or waiting for `next_run_at` in the future)
- `running` — claimed by a worker
- `success` — completed successfully
- `failed` — permanently failed (no further retries)

For now, `status` can stay as `text` with a CHECK constraint or app-level
validation. If we later introduce a Postgres enum, this doc should be
updated to match.

---

## 2. Backoff & retry rules

Helper functions live in `lib/jobs.ts`.

- `getBackoffDelayMs(attempts: number): number`
  - Exponential backoff:
    - attempts 0–1 → 1s
    - attempts 2 → 2s
    - attempts 3 → 4s
    - attempts 4 → 8s
    - ...
  - Capped at **60 seconds**.

- `canRetry(status: JobStatus, attempts: number, maxAttempts = DEFAULT_MAX_ATTEMPTS): boolean`
  - Returns `false` for `success` or `running`.
  - Returns `true` only if attempts `< maxAttempts` (default 5).

The typical pattern for a failed job:

1. Worker runs the job and catches an error.
2. If `canRetry("failed", attempts, maxAttempts)` is `true`:
   - increment `attempts`
   - set `status = 'queued'`
   - set `next_run_at = now() + getBackoffDelayMs(attempts)`
3. If `canRetry` is `false`, set `status = 'failed'` and keep `last_error`.

---

## 3. Dedupe keys (avoiding noisy jobs)

To avoid enqueuing a flood of nearly-identical jobs, we define a
deterministic dedupe key:

- `makeJobDedupeKey(type, orgId, payload) : string`
  - Uses a stable, sorted JSON stringification of `payload`.
  - Format: `"<type>::<orgId|global>::<sorted-json>"`

Usage pattern:

- When enqueuing:
  - Compute `dedupe_key` and optionally check the `jobs` table for an
    existing `queued`/`running` job with the same key.
  - Skip enqueue or coalesce if appropriate.

Actual `dedupe_key` column is not yet part of the schema; we can add it
once we decide how aggressive we want deduplication to be.

---

## 4. JobsRepository abstraction

`lib/jobs.ts` defines a minimal `JobsRepository` interface:

- `enqueue(input: EnqueueJobInput): Promise<string>`
- `markSuccess(id: string): Promise<void>`
- `markFailure(id: string, error: string): Promise<void>`

where:

- `EnqueueJobInput` includes:
  - `type: string`
  - `orgId?: string | null`
  - `payload?: Record<string, unknown>`
  - `runAt?: Date | null`

A future Supabase-backed implementation can:

- Map `EnqueueJobInput` into the `jobs` table.
- Use `getBackoffDelayMs` and `canRetry` for retry behaviour.
- Optionally add dedupe support using `makeJobDedupeKey`.

---

## 5. Dev tick endpoint (PG-W1 scope)

`lib/jobs.ts` also exports:

- `runJobsTickDev(): Promise<void>`

For PG-W1, this is a **no-op placeholder** that does nothing. The goal
is simply to establish a clean call site for a dev-only endpoint such as:

- `POST /api/jobs/tick`
  - Calls `runJobsTickDev()` and returns `{ ok: true }`.

In a later PG week, once the Supabase repository is implemented, this
helper will:

- Claim at most N runnable jobs (by `status` + `next_run_at` ≤ now).
- Execute them in-process.
- Apply `markSuccess` / `markFailure` with backoff.

---

## 6. Next steps

- Add a real Supabase-backed `JobsRepository` implementation and wire it
  into `runJobsTickDev`.
- Decide on `dedupe_key` strategy and add the column + indexes if needed.
- Once the queue is live, emit usage/metering events for job runs so we
  can observe background work cost and reliability in Insights.

