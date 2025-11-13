import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const { shareId, passcode } = await req.json();
    if (!shareId || typeof passcode !== "string") {
      return NextResponse.json({ error: "Missing shareId or passcode" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: share, error } = await supabase
      .from("shares")
      .select("id, passcode_required, passcode_sha256")
      .eq("id", shareId)
      .single();

    if (error || !share) return NextResponse.json({ error: "Share not found" }, { status: 404 });
    if (!share.passcode_required) return NextResponse.json({ ok: true, note: "No passcode required" });

    const sha = crypto.createHash("sha256").update(passcode, "utf8").digest("hex");
    if (sha !== share.passcode_sha256) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(`share_${shareId}`, "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
