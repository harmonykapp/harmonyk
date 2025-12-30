export type JobStatus = "queued" | "running" | "success" | "failed";

export interface Job {
  id: string;
  type: string;
  orgId: string | null;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  nextRunAt: string | null; // ISO8601
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueJobInput {
  type: string;
  orgId?: string | null;
  payload?: Record<string, unknown>;
  runAt?: Date | null;
}

export const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Exponential backoff in milliseconds.
 *
 * attempts = 0 → 1s
 * attempts = 1 → 1s
 * attempts = 2 → 2s
 * attempts = 3 → 4s
 * attempts = 4 → 8s
 * ...
 * capped at 60s
 */
export function getBackoffDelayMs(attempts: number): number {
  const baseMs = 1_000;
  const maxMs = 60_000;

  if (attempts <= 1) {
    return baseMs;
  }

  const exponent = attempts - 1;
  const delay = baseMs * 2 ** exponent;
  return delay > maxMs ? maxMs : delay;
}

/**
 * Simple gate to decide if a job should be retried.
 */
export function canRetry(
  status: JobStatus,
  attempts: number,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
): boolean {
  if (status === "success" || status === "running") {
    return false;
  }
  return attempts < maxAttempts;
}

/**
 * Stable stringify helper used for dedupe keys.
 * Ensures consistent ordering of object keys.
 */
function sortedStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => sortedStableStringify(item));
    return `[${items.join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([aKey], [bKey]) => {
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return 0;
    }
  );

  const inner = entries
    .map(([key, val]) => `${JSON.stringify(key)}:${sortedStableStringify(val)}`)
    .join(",");

  return `{${inner}}`;
}

/**
 * Deterministic dedupe key, so callers can avoid enqueuing
 * a flood of near-identical jobs.
 *
 * Example:
 *  makeJobDedupeKey("hygiene_scan", "org-123", { folderId: "abc" })
 */
export function makeJobDedupeKey(
  type: string,
  orgId: string | null,
  payload: Record<string, unknown>
): string {
  const base = `${type}::${orgId ?? "global"}`;
  return `${base}::${sortedStableStringify(payload)}`;
}

/**
 * Minimal repository interface. A Supabase-backed implementation
 * can live elsewhere and satisfy this contract.
 */
export interface JobsRepository {
  enqueue(input: EnqueueJobInput): Promise<string>;
  markSuccess(id: string): Promise<void>;
  markFailure(id: string, error: string): Promise<void>;
}

export async function enqueueJob(
  repo: JobsRepository,
  input: EnqueueJobInput
): Promise<string> {
  return repo.enqueue(input);
}

export async function markJobSuccess(
  repo: JobsRepository,
  id: string
): Promise<void> {
  await repo.markSuccess(id);
}

export async function markJobFailure(
  repo: JobsRepository,
  id: string,
  error: string
): Promise<void> {
  await repo.markFailure(id, error);
}

/**
 * Dev-only tick helper.
 *
 * PG-W1 scope: this is just a placeholder hook for a future
 * Supabase-backed implementation. It exists so that
 * /api/jobs/tick can safely call into something without
 * knowing anything about the database layer yet.
 */
export async function runJobsTickDev(): Promise<void> {
  // Intentionally empty for PG-W1.
  // Real job-claiming and execution will be wired once the
  // Supabase JobsRepository implementation is added.
}

