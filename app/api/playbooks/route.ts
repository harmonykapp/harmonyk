// Week 17 Day 6: GET /api/playbooks
// Returns all playbooks for the current org with normalized types

import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { getAllPlaybooksForOrg } from "@/lib/playbooks/db";
import { ensureContractPlaybooksForOrg } from "@/lib/playbooks/templates/contracts";
import { ensureDeckPlaybooksForOrg } from "@/lib/playbooks/templates/decks";
import { ensureAccountsPlaybooksForOrg } from "@/lib/playbooks/templates/accounts";
import type { Playbook } from "@/lib/playbooks/types";

export interface PlaybookListItem {
  id: string;
  name: string;
  trigger: Playbook["trigger"];
  status: Playbook["status"];
  lastRunAt: string | null;
  conditions: Playbook["conditions"];
  actions: Playbook["actions"];
}

export async function GET(req: NextRequest) {
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

    const orgId = auth.orgId;
    const supabase = auth.supabase;

    // Seed GA playbooks for this org on-demand.
    // These helpers are idempotent and will no-op if the templates already exist.
    try {
      await Promise.all([
        ensureContractPlaybooksForOrg({ client: supabase, orgId }),
        ensureDeckPlaybooksForOrg({ client: supabase, orgId }),
        ensureAccountsPlaybooksForOrg({ client: supabase, orgId }),
      ]);
    } catch (seedError) {
      // Fail soft on seeding; listing should still work with whatever exists.
      // Optional TODO: log this via ActivityLog/telemetry.
    }

    const playbooks = await getAllPlaybooksForOrg(supabase, orgId);

    // Map to DTO for response
    const items: PlaybookListItem[] = playbooks.map((p) => ({
      id: p.id,
      name: p.name,
      trigger: p.trigger,
      status: p.status,
      lastRunAt: p.lastRunAt,
      conditions: p.conditions,
      actions: p.actions,
    }));

    return NextResponse.json(
      {
        ok: true,
        items,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/playbooks] error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error while fetching playbooks",
      },
      { status: 500 },
    );
  }
}

