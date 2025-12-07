// Week 18 Day 6: Event-based executor for /api/playbooks/run
// - Accepts a PlaybookEvent { type, payload }
// - Optionally enriches with org_id from auth context
// - Delegates execution to the Playbooks engine via queuePlaybooksForEvent
// - Fire-and-forget: engine writes playbook_runs + ActivityLog

import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import {
  queuePlaybooksForEvent,
  type PlaybookEvent,
  type PlaybookEventType,
} from "@/lib/playbooks/events";

interface RunRequestBody {
  // Preferred shape
  type?: PlaybookEventType;
  payload?: Record<string, unknown>;
  // Back-compat shape
  event?: {
    type?: PlaybookEventType;
    payload?: Record<string, unknown>;
  };
}

function normalizeBodyToEvent(body: RunRequestBody): PlaybookEvent | null {
  const directType = body.type;
  const directPayload = body.payload;

  const nestedType = body.event?.type;
  const nestedPayload = body.event?.payload;

  const type = directType ?? nestedType;
  const payload = directPayload ?? nestedPayload;

  if (!type || !payload) {
    return null;
  }

  return {
    type,
    payload,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Auth is org-scoped. In dev, we fall back to a default org via getRouteAuthContext.
    const auth = await getRouteAuthContext(req as unknown as Request);

    if (!auth.orgId && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as RunRequestBody;
    const event = normalizeBodyToEvent(body);

    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid body. Expected { type, payload } or { event: { type, payload } }",
        },
        { status: 400 },
      );
    }

    // Ensure org_id is present in payload for Playbooks engine.
    const payloadWithOrg: PlaybookEvent["payload"] = {
      ...event.payload,
      org_id: (event.payload as { org_id?: string })?.org_id ?? auth.orgId ?? undefined,
    };

    const finalEvent: PlaybookEvent = {
      type: event.type,
      payload: payloadWithOrg,
    };

    const result = await queuePlaybooksForEvent(finalEvent);

    // queuePlaybooksForEvent never throws; it returns { ok, message?, count }
    return NextResponse.json(
      {
        ok: result.ok,
        trigger: finalEvent.type,
        message: result.message ?? "Playbooks queued for event",
        count: result.count ?? 0,
      },
      { status: result.ok ? 200 : 400 },
    );
  } catch (error) {
    console.error("[POST /api/playbooks/run] error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error in /api/playbooks/run",
      },
      { status: 500 },
    );
  }
}
