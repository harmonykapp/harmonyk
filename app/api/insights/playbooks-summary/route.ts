import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlaybookRunRow = {
  id: string;
  stats_json: {
    time_saved_minutes?: number | null;
    [key: string]: unknown;
  } | null;
  started_at: string | null;
};

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Supabase URL or service role key missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
      },
      { status: 500 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

  try {
    // v1: simple aggregate across recent runs.
    // Later we can add date ranges and per-team filters.
    const { data, error } = await supabase
      .from("playbook_runs")
      .select("id, stats_json, started_at")
      .order("started_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("[insights] playbooks-summary query error", error);
      return NextResponse.json(
        {
          ok: false,
          message: error.message ?? "Failed to load playbook runs",
        },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as PlaybookRunRow[];

    let totalMinutesFromStats = 0;
    let runsWithStats = 0;
    let runsWithoutStats = 0;

    for (const row of rows) {
      const stats = row.stats_json;
      if (stats && typeof stats.time_saved_minutes === "number") {
        totalMinutesFromStats += stats.time_saved_minutes;
        runsWithStats += 1;
      } else {
        // Fallback: assume 5 minutes per run when no explicit stats exist.
        totalMinutesFromStats += 5;
        runsWithoutStats += 1;
      }
    }

    const totalRuns = rows.length;

    return NextResponse.json(
      {
        ok: true,
        totalMinutes: totalMinutesFromStats,
        runsCount: totalRuns,
        runsWithStats,
        runsWithoutStats,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[insights] playbooks-summary unexpected error", err);
    return NextResponse.json(
      {
        ok: false,
        message: "UNEXPECTED_ERROR: Failed to load Playbooks summary.",
      },
      { status: 500 },
    );
  }
}

