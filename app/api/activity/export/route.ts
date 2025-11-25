// Week 8: Activity CSV export API
//
// POST /api/activity/export
//
// Body:
// {
//   "workspaceId": "uuid",
//   "ownerId": "uuid (optional)",
//   "filters": {
//     // ActivityQueryFilters (same as /api/activity/query)
//   }
// }
//
// Response: text/csv of raw events, suitable for debugging and light analysis.

import { getActivityEventLabel } from "@/lib/activity-events";
import type { ActivityLogRow, ActivityQueryFilters } from "@/lib/activity-log";
import { buildActivityLogQuery } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RequestBody = {
  workspaceId?: string;
  ownerId?: string;
  filters?: ActivityQueryFilters;
};

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const s = value.replace(/"/g, '""');
    return `"${s}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  // JSON encode objects/arrays
  const s = JSON.stringify(value).replace(/"/g, '""');
  return `"${s}"`;
}

function serializeActivityRowsToCsv(rows: ActivityLogRow[]): string {
  const header = [
    "id",
    "created_at",
    "workspace_id",
    "owner_id",
    "document_id",
    "share_link_id",
    "playbook_run_id",
    "connector_id",
    "event_type",
    "event_label",
    "source",
    "payload",
    "error",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (const row of rows) {
    const eventType = row.event_type as any;
    const eventLabel =
      typeof eventType === "string" && (getActivityEventLabel as any)
        ? getActivityEventLabel(eventType as any)
        : eventType;

    const line = [
      toCsvValue(row.id),
      toCsvValue(row.created_at),
      toCsvValue(row.workspace_id),
      toCsvValue(row.owner_id),
      toCsvValue(row.document_id),
      toCsvValue(row.share_link_id),
      toCsvValue(row.playbook_run_id),
      toCsvValue(row.connector_id),
      toCsvValue(row.event_type),
      toCsvValue(eventLabel),
      toCsvValue(row.source),
      toCsvValue(row.payload),
      toCsvValue(row.error),
    ].join(",");

    lines.push(line);
  }

  return lines.join("\n");
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

  try {
    const supabase = createClient();

    const query = buildActivityLogQuery(supabase, {
      workspaceId: body?.workspaceId,
      ownerId: body.ownerId,
      filters: body.filters,
    });

    const { data, error } = await query;

    if (error) {
      console.error("[Activity Export API] Query error", error);
      return NextResponse.json(
        {
          error: {
            message: "Failed to export activity",
            details: error,
          },
        },
        { status: 500 }
      );
    }

    const rows = (data as ActivityLogRow[] | null) ?? [];
    const csv = serializeActivityRowsToCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="activity_export.csv"',
      },
    });
  } catch (err) {
    console.error("[Activity Export API] Unexpected error", err);
    return NextResponse.json(
      {
        error: {
          message: "Unexpected error while exporting activity",
          details: String(err),
        },
      },
      { status: 500 }
    );
  }
}
