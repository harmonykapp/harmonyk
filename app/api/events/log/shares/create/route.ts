import { NextRequest, NextResponse } from "next/server";
import { putShare } from "../_store";
import {
  queuePlaybooksForEvent,
  type PlaybookEventPayload,
} from "@/lib/playbooks/events";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null) as { title: string; html?: string; markdown?: string } | null;
    if (!body?.title || (!body.html && !body.markdown)) {
        return NextResponse.json({ ok: false, reason: "bad_input" }, { status: 400 });
    }
    const id = Math.random().toString(36).slice(2, 10);
    putShare({ id, title: body.title, html: body.html, markdown: body.markdown });

    // existing logic that logs the share event to ActivityLog / DB
    // ...

    // Fire-and-forget Playbooks hook for real share events
    try {
      await queuePlaybooksForEvent({
        type: "share_link_created",
        payload: body as PlaybookEventPayload,
      });
    } catch (err) {
      console.warn(
        "[playbooks] Failed to queue event for share_link_created",
        err,
      );
    }

    return NextResponse.json({ ok: true, shareId: id, url: `/share/${id}` });
}
