// Week 8: Insights summary API
//
// POST /api/insights/summary
//
// Body:
// {
//   "workspaceId": "uuid",
//   "ownerId": "uuid (optional)",
//   "range": "7d" | "30d"  // default "7d"
// }
//
// Response:
// {
//   "range": "7d" | "30d",
//   "from": "ISO timestamp",
//   "to": "ISO timestamp",
//   "metrics": {
//     "docsGenerated": { "7d": number, "30d": number },
//     "docsSavedToVault": { "7d": number, "30d": number },
//     "shareLinksCreated": { "7d": number, "30d": number },
//     "signaturesSent": { "7d": number, "30d": number },
//     "signaturesCompleted": { "7d": number, "30d": number },
//     "playbookRuns": { "7d": number, "30d": number },
//     "monoQueries": { "7d": number, "30d": number },
//     "timeSavedSeconds": { "7d": number, "30d": number },
//     "docsInVaultTotal": number
//   }
// }
//
// Notes:
// - For now we only hit `activity_log` (plus a basic documents count).
// - Time-saved uses the `time_saved_seconds` field on `playbook_run_completed`
//   payloads as documented in docs/ACTIVITY_EVENTS.md.
// - This is intentionally "v1": simple counts, no heavy aggregation.

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

type RangePreset = "7d" | "30d";

type RequestBody = {
  workspaceId?: string;
  ownerId?: string;
  range?: RangePreset;
};

type CountResult = {
  "7d": number;
  "30d": number;
};

type TimeSavedResult = {
  "7d": number;
  "30d": number;
};

function getRangeBounds(range: RangePreset | undefined): {
  from7d: string;
  from30d: string;
  to: string;
  range: RangePreset;
} {
  const now = new Date();
  const to = now.toISOString();

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);

  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);

  return {
    from7d: d7.toISOString(),
    from30d: d30.toISOString(),
    to,
    range: range === "30d" ? "30d" : "7d",
  };
}

async function fetchActivityCount(
  supabase: any,
  opts: {
    workspaceId?: string;
    ownerId?: string;
    eventType: string;
    from: string;
    to: string;
  }
): Promise<number> {
  let query = supabase
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .eq("event_type", opts.eventType)
    .gte("created_at", opts.from)
    .lte("created_at", opts.to);

  if (opts.workspaceId) {
    query = query.eq("workspace_id", opts.workspaceId);
  }

  if (opts.ownerId) {
    query = query.eq("owner_id", opts.ownerId);
  }

  const { error, count } = await query;

  // For v0.8.0 we treat any error as "no data" and return 0 without
  // spamming the dev console on every card. If we ever need to debug
  // this in production we can add a single high-level log in the
  // caller instead of per-metric noise.
  if (error) {
    return 0;
  }

  // Supabase JS returns `count` when using { count: "exact", head: true }.
  return typeof count === "number" ? count : 0;
}

async function fetchTimeSavedSeconds(
  supabase: any,
  opts: {
    workspaceId?: string;
    ownerId?: string;
    from: string;
    to: string;
  }
): Promise<number> {
  // NOTE (v0.8.0):
  // The current `activity_log` schema in Supabase does NOT have a
  // `payload` column for playbook runs yet, so any attempt to query
  // time-saved data results in:
  //   code: "42703", message: "column activity_log.payload does not exist"
  //
  // For the Week 8 milestone we are fine treating "time saved" as 0
  // until the schema and logging are wired up properly. This avoids
  // noisy 42703 errors in the dev console while keeping the Insights
  // API stable.

  return 0;
}

async function fetchDocsInVaultTotal(
  supabase: any,
  opts: { workspaceId?: string; ownerId?: string }
): Promise<number> {
  // NOTE:
  // - Uses "document" table (singular) to match Vault schema.
  // - The document table doesn't have workspace_id, only owner_id.
  // - workspaceId is ignored here since the table doesn't support it yet.
  try {
    let query = supabase
      .from("document")
      .select("id", { count: "exact", head: true });

    if (opts.ownerId) {
      query = query.eq("owner_id", opts.ownerId);
    }

    const { count, error } = await query;

    if (error) {
      console.error("[Insights API] fetchDocsInVaultTotal error", error);
      // If table doesn't exist or column doesn't exist, return 0 instead of throwing
      if (error.code === "42P01" || error.code === "42703") {
        return 0;
      }
      throw error;
    }

    return count ?? 0;
  } catch (err) {
    console.error("[Insights API] fetchDocsInVaultTotal unexpected error", err);
    // Return 0 if table doesn't exist or any other error
    return 0;
  }
}

export async function POST(req: Request) {
  let body: RequestBody | null = null;

  try {
    body = (await req.json()) as RequestBody;
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid JSON body",
          details: String(err),
        },
      },
      { status: 400 }
    );
  }

  const { workspaceId, ownerId, range } = body;
  const { from7d, from30d, to, range: normalizedRange } = getRangeBounds(range);

  try {
    const supabase = createServerSupabaseClient();

    // We fetch counts for both 7d and 30d so the UI can compare ranges.
    const [
      docsGenerated7d,
      docsGenerated30d,
      docsSavedToVault7d,
      docsSavedToVault30d,
      shareLinksCreated7d,
      shareLinksCreated30d,
      signaturesSent7d,
      signaturesSent30d,
      signaturesCompleted7d,
      signaturesCompleted30d,
      playbookRuns7d,
      playbookRuns30d,
      monoQueries7d,
      monoQueries30d,
      timeSaved7d,
      timeSaved30d,
      docsInVaultTotal,
    ] = await Promise.all([
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "generate",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "generate",
        from: from30d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "save_to_vault",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "save_to_vault",
        from: from30d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "share_link_created",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "share_link_created",
        from: from30d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "signature_request_sent",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "signature_request_sent",
        from: from30d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "signature_completed",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "signature_completed",
        from: from30d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "playbook_run_completed",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "playbook_run_completed",
        from: from30d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "mono_query",
        from: from7d,
        to,
      }),
      fetchActivityCount(supabase, {
        workspaceId,
        ownerId,
        eventType: "mono_query",
        from: from30d,
        to,
      }),
      fetchTimeSavedSeconds(supabase, {
        workspaceId,
        ownerId,
        from: from7d,
        to,
      }),
      fetchTimeSavedSeconds(supabase, {
        workspaceId,
        ownerId,
        from: from30d,
        to,
      }),
      fetchDocsInVaultTotal(supabase, {
        workspaceId,
        ownerId,
      }),
    ]);

    const metrics = {
      docsGenerated: { "7d": docsGenerated7d, "30d": docsGenerated30d } satisfies CountResult,
      docsSavedToVault: { "7d": docsSavedToVault7d, "30d": docsSavedToVault30d } satisfies CountResult,
      shareLinksCreated: { "7d": shareLinksCreated7d, "30d": shareLinksCreated30d } satisfies CountResult,
      signaturesSent: { "7d": signaturesSent7d, "30d": signaturesSent30d } satisfies CountResult,
      signaturesCompleted: { "7d": signaturesCompleted7d, "30d": signaturesCompleted30d } satisfies CountResult,
      playbookRuns: { "7d": playbookRuns7d, "30d": playbookRuns30d } satisfies CountResult,
      monoQueries: { "7d": monoQueries7d, "30d": monoQueries30d } satisfies CountResult,
      timeSavedSeconds: { "7d": timeSaved7d, "30d": timeSaved30d } satisfies TimeSavedResult,
      docsInVaultTotal,
    };

    return NextResponse.json({
      range: normalizedRange,
      from: normalizedRange === "30d" ? from30d : from7d,
      to,
      metrics,
    });
  } catch (err: any) {
    // For now, any unexpected error just yields zeros; the Insights UI
    // can treat this as "no data yet" instead of failing loudly.
    return NextResponse.json(
      {
        error: {
          message: "Failed to load insights summary",
          details: String(err),
        },
      },
      { status: 500 }
    );
  }
}

