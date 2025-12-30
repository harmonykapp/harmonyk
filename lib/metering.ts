import { createClient } from "@supabase/supabase-js";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Use the inferred Supabase client type from createClient.
// We avoid explicit `any` while still keeping things flexible.
type SupabaseGenericClient = ReturnType<typeof createClient>;

export type UsageEventType =
  | "doc_created"
  | "doc_saved"
  | "contract_generated"
  | "deck_generated"
  | "signature_sent"
  | "ai_call"
  | "storage_bytes_delta"
  | "connector_sync";

export interface UsageEventInput {
  orgId: string;
  userId?: string | null;
  eventType: UsageEventType;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface UsageSummaryRow {
  orgId: string | null;
  eventType: string;
  totalAmount: number;
  eventCount: number;
  lastEventAt: string;
}

function getServiceClient(): SupabaseGenericClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "[metering] Supabase URL or service role key is not configured"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Server-only helper to log a single metering event.
 *
 * PG-W1 scope:
 * - Safe to call from server actions / route handlers.
 * - Swallows errors with console warnings so metering never
 *   breaks user-facing flows.
 */
export async function logUsageEvent(input: UsageEventInput): Promise<void> {
  const client = getServiceClient();
  const { orgId, userId, eventType, amount, metadata } = input;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client.from("metering_events") as any).insert({
      org_id: orgId,
      user_id: userId ?? null,
      event_type: eventType,
      amount: typeof amount === "number" ? amount : 1,
      metadata: (metadata ?? {}) as Json,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[metering] Failed to log usage event", error);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[metering] Unexpected error logging usage event", error);
  }
}

/**
 * Internal helper used by /admin/metrics to read a simple
 * 7-day aggregate by org + event type.
 *
 * This is intentionally approximate and only for internal
 * sanity checks during PGW1.
 */
export async function getUsageSummaryLast7Days(): Promise<UsageSummaryRow[]> {
  const client = getServiceClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const { data, error } = await client
      .from("metering_events")
      .select("org_id, event_type, amount, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[metering] Failed to fetch usage summary", error);
      }
      return [];
    }

    const rows = Array.isArray(data)
      ? (data as Array<{
          org_id: string | null;
          event_type: string;
          amount: number | null;
          created_at: string;
        }>)
      : [];

    const aggregate = new Map<string, UsageSummaryRow>();

    for (const row of rows) {
      const key = `${row.org_id ?? "null"}::${row.event_type}`;
      const existing = aggregate.get(key);
      const amount = typeof row.amount === "number" ? row.amount : 1;

      if (!existing) {
        aggregate.set(key, {
          orgId: row.org_id,
          eventType: row.event_type,
          totalAmount: amount,
          eventCount: 1,
          lastEventAt: row.created_at,
        });
      } else {
        const lastEventAt =
          existing.lastEventAt > row.created_at
            ? existing.lastEventAt
            : row.created_at;

        aggregate.set(key, {
          ...existing,
          totalAmount: existing.totalAmount + amount,
          eventCount: existing.eventCount + 1,
          lastEventAt,
        });
      }
    }

    return Array.from(aggregate.values()).sort((a, b) => {
      if (a.eventType < b.eventType) return -1;
      if (a.eventType > b.eventType) return 1;
      if ((a.orgId ?? "") < (b.orgId ?? "")) return -1;
      if ((a.orgId ?? "") > (b.orgId ?? "")) return 1;
      return 0;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[metering] Unexpected error fetching usage summary", error);
    return [];
  }
}

