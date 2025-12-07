// Week 17 Day 6: GET /api/playbooks/[id]/dry-run
// Perform a dry-run simulation of a playbook (no DB writes)

import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { getAllPlaybooksForOrg } from "@/lib/playbooks/db";
import { dryRunPlaybook } from "@/lib/playbooks/engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getRouteAuthContext(req as unknown as Request);

    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const orgId = auth.orgId;
    const supabase = auth.supabase;

    // Load all playbooks for org to find the one we want
    const playbooks = await getAllPlaybooksForOrg(supabase, orgId);
    const playbook = playbooks.find((p) => p.id === id);

    if (!playbook) {
      return NextResponse.json(
        {
          ok: false,
          error: "Playbook not found or access denied",
        },
        { status: 404 },
      );
    }

    // Perform dry-run (pure function, no DB writes)
    const result = dryRunPlaybook(playbook);

    // Sanitize sampleEvent payload for safe display (remove any secrets)
    // For now, we'll return it as-is since it's generated deterministically
    const safeSampleEvent = {
      trigger: result.sampleEvent.trigger,
      payload: result.sampleEvent.payload,
    };

    return NextResponse.json(
      {
        ok: true,
        playbookId: result.playbookId,
        sampleEvent: safeSampleEvent,
        conditions: result.conditions,
        willRunActions: result.willRunActions,
        actions: result.actions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/playbooks/[id]/dry-run] error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error while performing dry-run",
      },
      { status: 500 },
    );
  }
}

