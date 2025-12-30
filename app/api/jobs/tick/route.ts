import { NextResponse } from "next/server";
import { runJobsTickDev } from "@/lib/jobs";

/**
 * Dev-only jobs tick endpoint.
 *
 * PG-W1 scope:
 * - Calls into runJobsTickDev(), which is currently a no-op placeholder.
 * - Exists so we can later wire a Supabase-backed JobsRepository
 *   without changing callers.
 *
 * Expected usage (local/dev):
 * - POST /api/jobs/tick
 *   → { ok: true } on success
 */
export async function POST() {
  try {
    await runJobsTickDev();
    return NextResponse.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[jobs.tick] Error running dev tick", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to run jobs tick",
      },
      {
        status: 500,
      }
    );
  }
}

