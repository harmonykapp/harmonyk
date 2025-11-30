import { NextRequest, NextResponse } from "next/server";

import {
  classifyFinancialDocument,
  type RawConnectorFileMeta,
} from "@/lib/accounts-scanner";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RawConnectorFileMeta> & {
      // allow some looser aliases from callers
      subject?: string;
      title?: string;
      provider?: string;
      path?: string;
    };

    const title =
      body.title ??
      body.subject ??
      body.fileName ??
      "Untitled document";

    const mimeType = body.mimeType ?? "";
    const fileName = body.fileName ?? title;
    const provider = body.provider ?? "google_drive";
    const path = body.path ?? "";

    if (!title && !fileName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provide at least one of: title, subject, or fileName",
        },
        { status: 400 },
      );
    }

    // Map provider to source for RawConnectorFileMeta
    const sourceMap: Record<string, RawConnectorFileMeta["source"]> = {
      google_drive: "drive",
      drive: "drive",
      gmail: "gmail",
      quickbooks: "quickbooks",
      xero: "xero",
      manual: "manual",
    };

    const meta: RawConnectorFileMeta = {
      source: sourceMap[provider] ?? body.source ?? "other",
      fileName: fileName ?? null,
      mimeType: mimeType || null,
      subject: body.subject ?? (body.title ? null : title) ?? null,
      fromEmail: body.fromEmail ?? null,
      toEmail: body.toEmail ?? null,
      snippet: body.snippet ?? null,
      labels: body.labels ?? null,
    };

    const classification = classifyFinancialDocument(meta);

    return NextResponse.json(
      {
        ok: true,
        input: meta,
        classification,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[dev/accounts/classify] error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error while classifying document",
      },
      { status: 500 },
    );
  }
}

