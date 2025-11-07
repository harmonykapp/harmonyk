/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/events/log/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { doc_id, event_type, actor, meta } = await req.json();

    if (!doc_id || !event_type) {
      return NextResponse.json(
        { ok: false, error: "Missing doc_id or event_type" },
        { status: 400 }
      );
    }

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supa.from("events").insert({
      doc_id,
      event_type, // 'view' | 'download' | 'share_created'
      actor: actor ?? null, // user id if you have it (optional)
      meta_json: meta ?? {}, // {from: 'vault'} etc.
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
