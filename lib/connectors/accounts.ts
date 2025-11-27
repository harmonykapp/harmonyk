import { createClient } from "@supabase/supabase-js";

import type { GoogleOAuthTokens } from "./google-drive";
import type { GmailOAuthTokens } from "./gmail";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for supabaseAdmin");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for supabaseAdmin");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

// Day 6: plan-safe limit – for GA we may raise this and tie it to pricing,
// but for now we only support a single account per provider.
const MAX_ACCOUNTS_PER_PROVIDER = 1;

async function upsertConnectorAccount(provider: string, tokens: any) {
  // Look for an existing account for this provider.
  const { data: existing, error: selectError } = await supabaseAdmin
    .from("connector_accounts")
    .select("id, status, created_at")
    .eq("provider", provider)
    .order("created_at", { ascending: true })
    .limit(MAX_ACCOUNTS_PER_PROVIDER);

  if (selectError) {
    throw new Error(
      `Failed to load existing ${provider} connector account: ${selectError.message}`,
    );
  }

  const existingAccount = existing && existing.length > 0 ? existing[0] : null;

  // If we already have an account for this provider, treat this as a reconnect:
  // update tokens + status instead of inserting additional rows.
  if (existingAccount) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("connector_accounts")
      .update({
        status: "connected",
        token_json: tokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAccount.id)
      .select("id, provider, status, created_at")
      .single();

    if (updateError || !updated) {
      throw new Error(
        `Failed to update ${provider} connector account: ${
          updateError?.message ?? "unknown error"
        }`,
      );
    }

    return updated;
  }

  // Otherwise create a new account row for this provider.
  const { data, error } = await supabaseAdmin
    .from("connector_accounts")
    .insert({
      owner_id: null,
      provider,
      status: "connected",
      token_json: tokens,
    })
    .select("id, provider, status, created_at")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create ${provider} connector account: ${
        error?.message ?? "unknown error"
      }`,
    );
  }

  return data;
}

export async function createGoogleDriveAccount(tokens: GoogleOAuthTokens) {
  return upsertConnectorAccount("google_drive", tokens);
}

export async function createGmailAccount(tokens: GmailOAuthTokens) {
  return upsertConnectorAccount("gmail", tokens);
}
