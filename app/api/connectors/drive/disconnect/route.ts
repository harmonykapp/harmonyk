import { NextRequest, NextResponse } from "next/server";

// POST /api/connectors/drive/disconnect

// v1 placeholder: no-op disconnect handler for GA (revocation handled via Google account settings)

// - This endpoint currently returns 501 (not implemented).

// - In a later patch we will:

//   - Mark the connector_account as disconnected.

//   - Optionally revoke tokens at Google.

//   - Emit connector_account_disconnected Activity.

export async function POST(_req: NextRequest) {

  return NextResponse.json(

    {

      error: "Google Drive disconnect not implemented yet",

    },

    { status: 501 },

  );

}

