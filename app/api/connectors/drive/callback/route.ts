import { NextRequest, NextResponse } from "next/server";

import {
  exchangeCodeForTokens,
  mapGoogleDriveError,
} from "@/lib/connectors/google-drive";
import { createGoogleDriveAccount } from "@/lib/connectors/accounts";

// GET /api/connectors/drive/callback
//
// v1 behaviour:
// - Handles the OAuth redirect from Google.
// - Exchanges ?code= for tokens.
// - Does NOT yet persist connector_accounts or log Activity – that will be
//   added in a follow-up patch once the flow is proven.
//
// For now it returns a simple JSON payload so we can confirm:
// - The redirect URI is correct
// - Token exchange works
// - Error mapping is sane

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      {
        error: "Google returned an error",
        google_error: error,
      },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing code parameter from Google OAuth redirect" },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_APP_URL is not set",
        detail:
          "Set NEXT_PUBLIC_APP_URL in .env.local so OAuth redirectUri matches the Google Console config.",
      },
      { status: 500 },
    );
  }

  const redirectUri = `${appUrl}/api/connectors/drive/callback`;

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      redirectUri,
    });

    // Persist a connector_accounts row for this Drive connection.
    const account = await createGoogleDriveAccount(tokens);

    // GA note: full Drive OAuth callback handling (token exchange + refresh) is a post-GA enhancement.
    // For now we simply redirect back to the integrations page; Drive access is managed via Google's account UI.

    return NextResponse.json({
      status: "ok",
      provider: "google_drive",
      account,
      // Expose only what we need for debugging in v1. You can strip this down
      // later once the flow is stable.
      tokens: {
        has_access_token: Boolean(tokens.access_token),
        has_refresh_token: Boolean(tokens.refresh_token),
        expires_in: tokens.expires_in,
        scope: tokens.scope,
        token_type: tokens.token_type,
      },
    });
  } catch (err) {
    const mapped = mapGoogleDriveError(err);

    return NextResponse.json(
      {
        error: "Failed to exchange Google OAuth code for tokens",
        code: mapped.code,
        message: mapped.message,
        retryable: mapped.retryable,
      },
      { status: 500 },
    );
  }
}

