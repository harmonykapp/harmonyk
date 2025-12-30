import type { UsageEventType } from "@/lib/metering";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

type DevMeteringBody = {
  eventType?: UsageEventType;
  amount?: number;
  metadata?: Record<string, unknown>;
};

const ALLOWED_EVENT_TYPES: ReadonlySet<UsageEventType> = new Set([
  "ai_call",
  "doc_created",
  "signature_sent",
  "storage_bytes_delta",
]);

function normalizeAmount(amount: unknown): number {
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  return 1;
}

async function getOrCreateDevOrgId(
  supabase: ReturnType<typeof createServerSupabaseClient>,
): Promise<string> {
  const { data: demoOrgs, error: selectError } = await supabase
    .from("org")
    .select("id")
    .eq("name", "Demo Workspace")
    .limit(1);

  if (!selectError && demoOrgs && demoOrgs.length > 0) {
    return demoOrgs[0].id;
  }

  const { data: createdOrg, error: insertError } = await supabase
    .from("org")
    .insert({
      name: "Demo Workspace",
      plan: "free",
    })
    .select("id")
    .single();

  if (insertError || !createdOrg) {
    const message = insertError?.message ?? "Failed to create Demo Workspace org";
    throw new Error(message);
  }

  return createdOrg.id;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as DevMeteringBody | null;

    if (!body || !body.eventType) {
      return NextResponse.json(
        { error: "Missing eventType in request body" },
        { status: 400 },
      );
    }

    const { eventType, amount, metadata } = body;

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { error: `Unsupported eventType "${eventType}"` },
        { status: 400 },
      );
    }

    // PG-W1: hard-coded dev org. For real usage we will
    // derive orgId + userId from the authenticated session.
    const supabase = createServerSupabaseClient();
    const orgId = await getOrCreateDevOrgId(supabase);

    const insertPayload = {
      org_id: orgId,
      user_id: null,
      event_type: eventType,
      amount: normalizeAmount(amount),
      metadata: {
        ...(metadata ?? {}),
        source: "dev-metrics-page",
      },
    } as const;

    const { error: insertError } = await supabase
      .from("metering_events")
      .insert(insertPayload);

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error("[dev/metering] Insert failed", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent, error: selectError } = await supabase
      .from("metering_events")
      .select("org_id, event_type, amount, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (selectError) {
      // eslint-disable-next-line no-console
      console.error("[dev/metering] Summary select failed", selectError);
      return NextResponse.json({ ok: true, summary: [] });
    }

    const summary =
      (recent ?? []).map((row) => ({
        orgId: row.org_id ?? null,
        eventType: row.event_type,
        amount: row.amount,
        createdAt: row.created_at,
      })) ?? [];

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[dev/metering] Failed to log usage event", error);
    return NextResponse.json(
      { error: "Failed to log usage event" },
      { status: 500 },
    );
  }
}

