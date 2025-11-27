import { NextRequest, NextResponse } from "next/server";

import { getGmailAuthUrl, mapGmailError } from "@/lib/connectors/gmail";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      redirectUri?: string;
    };

    const redirectUri = body.redirectUri;

    if (!redirectUri || typeof redirectUri !== "string") {
      return NextResponse.json(
        { error: "Missing redirectUri in request body" },
        { status: 400 },
      );
    }

    const authUrl = getGmailAuthUrl({ redirectUri });

    return NextResponse.json({ authUrl });
  } catch (err) {
    const mapped = mapGmailError(err);
    return NextResponse.json(
      {
        error: "Failed to initiate Gmail connect flow",
        detail: mapped.message,
      },
      { status: 500 },
    );
  }
}

