import { supabaseAdmin } from "@/lib/connectors/accounts";

type ActivityContext = Record<string, any>;

/**
 * emitConnectorActivity
 *
 * Writes a row to the activity_log table using the same shape as existing
 * doc_* events:
 *
 *   org_id     – first org in the system (current Monolyth org)
 *   user_id    – null (system / background job)
 *   type       – connector_* event name
 *   context    – JSON payload for Insights / debugging
 *
 * All document-related foreign keys (document_id, version_id, etc.) are left
 * null for connector events.
 */
export async function emitConnectorActivity(
  type: string,
  context: ActivityContext,
): Promise<void> {
  try {
    // Resolve org_id from the org table (single-tenant for now).
    const { data: orgRow, error: orgError } = await supabaseAdmin
      .from("org")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (orgError) {
      console.error("[emitConnectorActivity] failed to resolve org_id", orgError);
    }

    const orgId = orgRow?.id ?? null;

    const { error: insertError } = await supabaseAdmin.from("activity_log").insert({
      org_id: orgId,
      user_id: null,
      type,
      document_id: null,
      version_id: null,
      unified_item_id: null,
      share_link_id: null,
      envelope_id: null,
      context,
    });

    if (insertError) {
      console.error(
        "[emitConnectorActivity] failed to insert activity_log row",
        insertError,
      );
    }
  } catch (err) {
    console.error("[emitConnectorActivity] unexpected error", err);
  }
}
