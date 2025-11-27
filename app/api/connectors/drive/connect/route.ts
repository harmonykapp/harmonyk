import { NextRequest, NextResponse } from "next/server";

import { getGoogleDriveAuthUrl } from "@/lib/connectors/google-drive";

// POST /api/connectors/drive/connect

// v1 behaviour:

// - Returns an authUrl for the client to redirect the user to Google.

// - We do NOT yet persist connector_accounts or log Activity here; that will

//   be layered on once the callback / account wiring is in place.

export async function POST(req: NextRequest) {

  try {

    const body = (await req.json().catch(() => ({}))) as {

      redirectUri?: string;

      state?: string;

    };

    const redirectUri =

      body.redirectUri ??

      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/connectors/drive/callback`;

    if (!redirectUri) {

      return NextResponse.json(

        { error: "Missing redirectUri and NEXT_PUBLIC_APP_URL" },

        { status: 500 },

      );

    }

    const authUrl = getGoogleDriveAuthUrl({

      redirectUri,

      state: body.state,

    });

    return NextResponse.json({ authUrl });

  } catch (err) {

    const message =

      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";

    return NextResponse.json(

      {

        error: "Failed to initiate Google Drive connect flow",

        detail: message,

      },

      { status: 500 },

    );

  }

}

