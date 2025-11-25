// Week 8: Insights CSV export API
//
// POST /api/insights/export
//
// Body:
// {
//   "workspaceId": "uuid",
//   "ownerId": "uuid (optional)",
//   "range": "7d" | "30d" // default "7d"
// }
//
// Response: text/csv with high-level metrics.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RangePreset = "7d" | "30d";

type RequestBody = {
  workspaceId?: string;
  ownerId?: string;
  range?: RangePreset;
};

type InsightsSummaryResponse = {
  range: RangePreset;
  from: string;
  to: string;
  metrics: {
    docsGenerated: { "7d": number; "30d": number };
    docsSavedToVault: { "7d": number; "30d": number };
    shareLinksCreated: { "7d": number; "30d": number };
    signaturesSent: { "7d": number; "30d": number };
    signaturesCompleted: { "7d": number; "30d": number };
    playbookRuns: { "7d": number; "30d": number };
    monoQueries: { "7d": number; "30d": number };
    timeSavedSeconds: { "7d": number; "30d": number };
    docsInVaultTotal: number;
  };
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
  const s = JSON.stringify(value).replace(/"/g, '""');
  return `"${s}"`;
}

function serializeInsightsSummaryToCsv(summary: InsightsSummaryResponse): string {
  const lines: string[] = [];

  lines.push("metric,window,value");

  const m = summary.metrics;

  const pushMetric = (name: string, window: string, value: number | string) => {
    lines.push(
      [toCsvValue(name), toCsvValue(window), toCsvValue(value)].join(",")
    );
  };

  pushMetric("docsGenerated", "7d", m.docsGenerated["7d"]);
  pushMetric("docsGenerated", "30d", m.docsGenerated["30d"]);

  pushMetric("docsSavedToVault", "7d", m.docsSavedToVault["7d"]);
  pushMetric("docsSavedToVault", "30d", m.docsSavedToVault["30d"]);

  pushMetric("shareLinksCreated", "7d", m.shareLinksCreated["7d"]);
  pushMetric("shareLinksCreated", "30d", m.shareLinksCreated["30d"]);

  pushMetric("signaturesSent", "7d", m.signaturesSent["7d"]);
  pushMetric("signaturesSent", "30d", m.signaturesSent["30d"]);

  pushMetric("signaturesCompleted", "7d", m.signaturesCompleted["7d"]);
  pushMetric("signaturesCompleted", "30d", m.signaturesCompleted["30d"]);

  pushMetric("playbookRuns", "7d", m.playbookRuns["7d"]);
  pushMetric("playbookRuns", "30d", m.playbookRuns["30d"]);

  pushMetric("monoQueries", "7d", m.monoQueries["7d"]);
  pushMetric("monoQueries", "30d", m.monoQueries["30d"]);

  pushMetric("timeSavedSeconds", "7d", m.timeSavedSeconds["7d"]);
  pushMetric("timeSavedSeconds", "30d", m.timeSavedSeconds["30d"]);

  pushMetric("docsInVaultTotal", "all", m.docsInVaultTotal);

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
    // Reuse the same logic as /api/insights/summary by calling it directly
    const supabase = createClient();
    // `supabase` not actually used here yet, but kept for future expansion.
    void supabase;

    const res = await fetch(new URL("/api/insights/summary", process.env.NEXT_PUBLIC_APP_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: body.workspaceId,
        ownerId: body.ownerId,
        range: body.range ?? "7d",
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      console.error("[Insights Export API] Summary error", errJson ?? res.statusText);
      return NextResponse.json(
        {
          error: {
            message: "Failed to load insights summary for export",
            details: errJson ?? res.statusText,
          },
        },
        { status: 500 }
      );
    }

    const summary = (await res.json()) as InsightsSummaryResponse;
    const csv = serializeInsightsSummaryToCsv(summary);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="insights_export.csv"',
      },
    });
  } catch (err) {
    console.error("[Insights Export API] Unexpected error", err);
    return NextResponse.json(
      {
        error: {
          message: "Unexpected error while exporting insights",
          details: String(err),
        },
      },
      { status: 500 }
    );
  }
}
