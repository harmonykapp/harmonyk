// Week 16 Day 4: Contracts Insights helper
//
// Derives simple Contracts KPIs for /insights from activity_log.
// Uses a 30-day window and relies on RLS for org scoping.

import type { SupabaseLikeClient } from "@/lib/activity-log";

export interface ContractsInsights {
  drafts_30d: number;
  sent_for_signature_30d: number;
  signed_30d: number;
}

function getWindow(days: number): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);
  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

async function countByTypePattern(
  supabase: SupabaseLikeClient,
  pattern: string,
  from: string,
  to: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .ilike("type", pattern)
    .gte("created_at", from)
    .lte("created_at", to);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[contracts-insights] countByTypePattern error", {
      pattern,
      error,
    });
    return 0;
  }

  return typeof count === "number" ? count : 0;
}

export async function getContractsInsightsForOrg(params: {
  supabase: SupabaseLikeClient;
  /**
   * Window size in days. Defaults to 30 to keep the metrics shape stable.
   */
  days?: number;
}): Promise<ContractsInsights> {
  const { supabase, days = 30 } = params;
  const { from, to } = getWindow(days);

  // For now we use broad patterns that are resilient to slight naming changes.
  // If we later standardize on specific contract_* event names, we can tighten
  // these filters while keeping the shape stable.
  const [
    drafts,
    sentForSignature,
    signed,
  ] = await Promise.all([
    // Drafts created in the Contracts Builder
    countByTypePattern(supabase, "contract_draft_created%", from, to),
    // Contracts sent for signature
    countByTypePattern(supabase, "contract_sent_for_signature%", from, to),
    // Signed contracts metric (approximate: uses contract_signed% event types for now)
    countByTypePattern(supabase, "contract_signed%", from, to),
  ]);

  return {
    drafts_30d: drafts,
    sent_for_signature_30d: sentForSignature,
    signed_30d: signed,
  };
}

