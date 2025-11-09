import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  type: string;               // client sends "type"; we'll map to event_type
  shareId?: string | null;
  docId?: string | null;
  meta?: Record<string, any>;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const body = (await req.json()) as Body;
    const eventType = (body?.type || "").trim();
    if (!eventType) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    const insertRow: any = {
      event_type: eventType,          // <-- key change
      share_id: body.shareId ?? null,
      doc_id: body.docId ?? null,
      meta: body.meta ?? null,
      // leave user_id / ip / referrer / user_agent null for public views
    };

    const { error } = await supabase.from("events").insert(insertRow);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
