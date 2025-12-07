import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's org_id
    const { data: orgData, error: orgError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { ok: false, error: "No org found" },
        { status: 404 }
      );
    }

    const orgId = orgData.org_id;

    // Check Google Drive connection
    const { data: driveStatus } = await supabase
      .from("connectors")
      .select("id")
      .eq("org_id", orgId)
      .eq("provider", "google_drive")
      .eq("account_status", "connected")
      .limit(1);

    const hasConnectedGoogleDrive = (driveStatus?.length ?? 0) > 0;

    // Check for contract drafts (documents with kind = "contract")
    const { data: contractDocs } = await supabase
      .from("document")
      .select("id")
      .eq("org_id", orgId)
      .eq("kind", "contract")
      .limit(1);

    const hasDraftedContract = (contractDocs?.length ?? 0) > 0;

    // Check for deck drafts (documents with kind = "deck")
    const { data: deckDocs } = await supabase
      .from("document")
      .select("id")
      .eq("org_id", orgId)
      .eq("kind", "deck")
      .limit(1);

    const hasDraftedDeck = (deckDocs?.length ?? 0) > 0;

    // Check for Vault documents (any document in the document table)
    const { data: vaultDocs } = await supabase
      .from("document")
      .select("id")
      .eq("org_id", orgId)
      .limit(1);

    const hasVaultDoc = (vaultDocs?.length ?? 0) > 0;

    // Check for Accounts pack runs
    const { data: packRuns } = await supabase
      .from("accounts_pack_runs")
      .select("id")
      .eq("org_id", orgId)
      .eq("status", "success")
      .limit(1);

    const hasRunAccountsPack = (packRuns?.length ?? 0) > 0;

    return NextResponse.json({
      ok: true,
      hasConnectedGoogleDrive,
      hasDraftedContract,
      hasDraftedDeck,
      hasVaultDoc,
      hasRunAccountsPack,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[onboarding/status] Error", error);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

