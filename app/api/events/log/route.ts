import { NextResponse } from "next/server";

type EventBody = {
  type: "share_open" | "share_scroll" | "builder_generate";
  shareId?: string;
  detail?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EventBody;
    // Minimal safety
    if (!body?.type) {
      return NextResponse.json({ ok: false, reason: "bad_event" }, { status: 400 });
    }

    // For now just log to server console. Replace with PostHog/Supabase in W3–W4.
    console.log("[event]", new Date().toISOString(), JSON.stringify(body));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }
}
