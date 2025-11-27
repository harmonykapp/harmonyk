import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGmailCodeForTokens,
  mapGmailError,
} from "@/lib/connectors/gmail";
import { createGmailAccount } from "@/lib/connectors/accounts";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing code parameter on Gmail callback" },
        { status: 400 },
      );
    }

    const redirectUri = `${req.nextUrl.origin}/api/connectors/gmail/callback`;

    const tokens = await exchangeGmailCodeForTokens({
      code,
      redirectUri,
    });

    const account = await createGmailAccount(tokens);

    return NextResponse.json({
      status: "ok",
      provider: "gmail",
      account,
      tokens: {
        has_access_token: Boolean(tokens.access_token),
        has_refresh_token: Boolean(tokens.refresh_token),
        expires_in: tokens.expires_in,
        scope: tokens.scope,
        token_type: tokens.token_type,
      },
    });
  } catch (err) {
    const mapped = mapGmailError(err);
    return NextResponse.json(
      {
        error: "Failed to handle Gmail callback",
        detail: mapped.message,
      },
      { status: 500 },
    );
  }
}

