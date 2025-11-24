// Configure this URL as the Documenso webhook endpoint for document status events.
// Manual test: POST a sample Documenso event body with a known provider_envelope_id to /api/webhooks/documenso.
// Expect envelopes.status updated and envelope_status_changed in /dev/activity-log.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logActivity } from "@/lib/activity-log";
import {
  queuePlaybooksForEvent,
  type PlaybookEventPayload,
} from "@/lib/playbooks/events";

// Documenso webhook event types (based on common e-signature webhook patterns)
type DocumensoWebhookEvent = {
  type: string; // e.g. "document.sent", "document.viewed", "document.completed", "document.declined"
  documentId?: string; // Documenso's document/envelope ID
  envelopeId?: string; // Alternative field name
  data?: {
    id?: string;
    status?: string;
    [key: string]: unknown;
  };
  timestamp?: string;
  [key: string]: unknown; // Allow other fields
};

function mapEventTypeToStatus(eventType: string): string {
  const normalized = eventType.toLowerCase();
  if (normalized.includes("sent")) return "sent";
  if (normalized.includes("viewed")) return "viewed";
  if (normalized.includes("completed") || normalized.includes("signed")) return "completed";
  if (normalized.includes("declined") || normalized.includes("rejected")) return "declined";
  if (normalized.includes("cancelled")) return "cancelled";
  if (normalized.includes("failed")) return "failed";
  return "unknown";
}

export async function POST(req: NextRequest) {
  // Reject non-POST requests
  if (req.method !== "POST") {
    return NextResponse.json(
      { ok: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const body = (await req.json()) as DocumensoWebhookEvent;

    // Extract provider envelope ID from various possible fields
    const providerEnvelopeId =
      body.documentId ?? body.envelopeId ?? body.data?.id ?? null;

    if (!providerEnvelopeId || typeof providerEnvelopeId !== "string") {
      console.warn("[webhook/documenso] Missing provider_envelope_id in webhook body", body);
      return NextResponse.json(
        { ok: false, error: "Missing documentId or envelopeId in webhook body" },
        { status: 400 }
      );
    }

    const eventType = body.type ?? "unknown";
    const mappedStatus = mapEventTypeToStatus(eventType);

    const supabase = createServerSupabaseClient();

    // Find envelope by provider_envelope_id
    const { data: envelope, error: envelopeError } = await supabase
      .from("envelope")
      .select("id, org_id, document_id, created_by, status, sent_at, completed_at, cancelled_at")
      .eq("provider_envelope_id", providerEnvelopeId)
      .eq("provider", "documenso")
      .maybeSingle();

    if (envelopeError) {
      console.error("[webhook/documenso] Error looking up envelope", {
        providerEnvelopeId,
        error: envelopeError,
      });
      return NextResponse.json(
        { ok: false, error: "Database error" },
        { status: 500 }
      );
    }

    if (!envelope) {
      console.warn("[webhook/documenso] Envelope not found for provider_envelope_id", providerEnvelopeId);
      // Return 200 so Documenso doesn't retry forever
      return NextResponse.json(
        { ok: true, ignored: true, reason: "envelope_not_found" },
        { status: 200 }
      );
    }

    // Get unified_item_id from document if not directly on envelope
    let unifiedItemId: string | null = null;
    if (envelope.document_id) {
      const { data: document } = await supabase
        .from("document")
        .select("id")
        .eq("id", envelope.document_id)
        .maybeSingle();

      if (document) {
        // Try to find unified_item linked to this document
        const { data: unifiedItem } = await supabase
          .from("unified_item")
          .select("id")
          .eq("document_id", document.id)
          .limit(1)
          .maybeSingle();

        if (unifiedItem) {
          unifiedItemId = unifiedItem.id;
        }
      }
    }

    // Update envelope status
    // Note: envelope table doesn't have a metadata column in the current schema
    // We store event info in activity_log.context instead
    const now = new Date().toISOString();

    // Update status-specific timestamps
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      updated_at: now,
    };

    if (mappedStatus === "sent" && !envelope.sent_at) {
      updateData.sent_at = now;
    }
    if (mappedStatus === "completed" && !envelope.completed_at) {
      updateData.completed_at = now;
    }
    if (mappedStatus === "cancelled" && !envelope.cancelled_at) {
      updateData.cancelled_at = now;
    }

    const { error: updateError } = await supabase
      .from("envelope")
      .update(updateData)
      .eq("id", envelope.id);

    if (updateError) {
      console.error("[webhook/documenso] Failed to update envelope", {
        envelopeId: envelope.id,
        error: updateError,
      });
      return NextResponse.json(
        { ok: false, error: "Failed to update envelope" },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await logActivity({
        orgId: envelope.org_id,
        userId: envelope.created_by,
        type: "envelope_status_changed",
        documentId: envelope.document_id,
        unifiedItemId: unifiedItemId,
        envelopeId: envelope.id,
        context: {
          provider: "documenso",
          provider_envelope_id: providerEnvelopeId,
          status: mappedStatus,
          event_type: eventType,
          previous_status: envelope.status,
          last_event_at: now,
          raw_event: {
            type: eventType,
            timestamp: body.timestamp ?? now,
            // Only include a small subset to avoid storing megabytes
            data_id: body.data?.id,
            data_status: body.data?.status,
          },
        },
      });
    } catch (logError) {
      // Don't fail the webhook if logging fails
      console.error("[webhook/documenso] Failed to log activity", logError);
    }

    console.log("[webhook/documenso] Successfully processed webhook", {
      providerEnvelopeId,
      eventType,
      mappedStatus,
      envelopeId: envelope.id,
    });

    // Only fire Playbooks event for completed signatures
    const playbookEventType =
      (body?.event as string | undefined) ??
      (body?.type as string | undefined) ??
      "";

    if (playbookEventType.toLowerCase() === "completed" || playbookEventType.toLowerCase() === "envelope.completed") {
      try {
        await queuePlaybooksForEvent({
          type: "signature_completed",
          payload: body as PlaybookEventPayload,
        });
      } catch (err) {
        console.warn(
          "[playbooks] Failed to queue event for signature_completed",
          err,
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook/documenso] Webhook error", err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

