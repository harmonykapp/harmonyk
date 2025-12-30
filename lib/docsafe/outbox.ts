import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type OutboxEventInput = {
  orgId: string | null;
  actorType?: Database["public"]["Enums"]["docsafe_actor_type"];
  actorId: string | null;
  eventType: string; // e.g. "share.created"
  idempotencyKey: string;
  harmonykDocumentId?: string | null;
  harmonykVersionId?: string | null;
  harmonykShareId?: string | null;
  envelopeId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  payload?: Database["public"]["Tables"]["docsafe_event_outbox"]["Insert"]["payload"];
};

function safeNowIso() {
  return new Date().toISOString();
}

/**
 * Fail-open DocSafe outbox enqueue.
 * - Idempotent on idempotency_key (unique index).
 * - Never throws; returns { ok: boolean }.
 */
export async function queueDocSafeOutboxEvent(
  supabase: SupabaseClient<Database>,
  input: OutboxEventInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const {
      orgId,
      actorType = "user",
      actorId,
      eventType,
      idempotencyKey,
      harmonykDocumentId = null,
      harmonykVersionId = null,
      harmonykShareId = null,
      envelopeId = null,
      ip = null,
      userAgent = null,
      payload = {},
    } = input;

    // Upsert to avoid duplicate insert failures on retries.
    const { error } = await supabase
      .from("docsafe_event_outbox")
      .upsert(
        {
          idempotency_key: idempotencyKey,
          event_type: eventType,
          schema_version: "v1",
          actor_type: actorType,
          actor_id: actorId,
          org_id: orgId,
          harmonyk_document_id: harmonykDocumentId,
          harmonyk_version_id: harmonykVersionId,
          harmonyk_share_id: harmonykShareId,
          envelope_id: envelopeId,
          ip,
          user_agent: userAgent,
          occurred_at: safeNowIso(),
          payload,
          status: "queued",
          attempt_count: 0,
          next_attempt_at: safeNowIso(),
          last_error: null,
          sent_at: null,
        },
        { onConflict: "idempotency_key" },
      );

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown outbox error";
    return { ok: false, error: message };
  }
}

