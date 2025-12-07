// Week 17 Day 6: PATCH /api/playbooks/[id]/status
// Toggle playbook status between active/inactive (org-scoped)

import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import type { PlaybookStatus } from "@/lib/playbooks/types";

interface StatusUpdateBody {
  status: "active" | "inactive";
}

export async function PATCH(
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

    let body: StatusUpdateBody;
    try {
      body = (await req.json()) as StatusUpdateBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body",
        },
        { status: 400 },
      );
    }

    if (!body.status || (body.status !== "active" && body.status !== "inactive")) {
      return NextResponse.json(
        {
          ok: false,
          error: "status must be 'active' or 'inactive'",
        },
        { status: 400 },
      );
    }

    // Verify playbook belongs to org and update status
    const { data, error } = await supabase
      .from("playbooks")
      .update({
        status: body.status as PlaybookStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("org_id", orgId)
      .select("id, name, trigger, status, updated_at")
      .single();

    if (error) {
      console.error("[PATCH /api/playbooks/[id]/status] error", error);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to update playbook status",
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Playbook not found or access denied",
        },
        { status: 404 },
      );
    }

    // Map to DTO
    return NextResponse.json(
      {
        ok: true,
        item: {
          id: data.id,
          name: data.name,
          trigger: data.trigger,
          status: data.status,
          updatedAt: data.updated_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PATCH /api/playbooks/[id]/status] error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error while updating playbook status",
      },
      { status: 500 },
    );
  }
}

