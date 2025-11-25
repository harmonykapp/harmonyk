// Week 8: ActivityLog query API
//
// POST /api/activity/query
//
// Body:
// {
//   "workspaceId": "uuid",
//   "ownerId": "uuid (optional)",
//   "filters": {
//     "from": "2025-11-01T00:00:00Z",
//     "to": "2025-11-30T23:59:59Z",
//     "eventTypes": ["generate", "save_to_vault"],
//     "documentId": "uuid",
//     "source": "builder | vault | workbench | share | signatures | playbooks | connector",
//     "hasError": false,
//     "search": "NDA"
//   }
// }
//
// Notes:
// - This route is intentionally generic so it can be used by:
//   - /activity page
//   - CSV export endpoints
//   - admin/QA tools

import type { ActivityQueryFilters } from "@/lib/activity-log";
import { buildActivityLogQuery } from "@/lib/activity-log";
import { NextResponse } from "next/server";

// IMPORTANT:
// We assume the app already has a server-side Supabase client helper.
// If the name/path differs, Cursor should adjust this import.
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RequestBody = {
  workspaceId?: string;
  ownerId?: string;
  filters?: ActivityQueryFilters;
};

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
    const supabase = createServerSupabaseClient();

    const query = buildActivityLogQuery(supabase, {
      workspaceId: body?.workspaceId,
      ownerId: body.ownerId,
      filters: body.filters,
    });

    const { data, error } = await query;

    if (error) {
      console.error("[Activity API] Query error", error);
      return NextResponse.json(
        {
          error: {
            message: "Failed to load activity",
            details: error,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[Activity API] Unexpected error", err);
    return NextResponse.json(
      {
        error: {
          message: "Unexpected error while loading activity",
          details: String(err),
        },
      },
      { status: 500 }
    );
  }
}

