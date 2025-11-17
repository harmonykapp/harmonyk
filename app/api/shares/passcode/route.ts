import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SHARE_PASSCODE_COOKIE_PREFIX, comparePasscodeHashes, hashPasscode } from "@/lib/shares";

const HOUR = 60 * 60;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { id, passcode } = await req.json();
    if (!id || typeof passcode !== "string") {
      return NextResponse.json({ ok: false, error: "Missing id or passcode" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: share } = await supabase
      .from("shares")
      .select("id, passcode_hash, passcode_required")
      .eq("id", id)
      .single();

    if (!share) {
      return NextResponse.json({ ok: false, error: "Share not found" }, { status: 404 });
    }

    const requiresPasscode = Boolean(share.passcode_required || share.passcode_hash);
    if (!requiresPasscode) {
      return NextResponse.json({ ok: true, requiresPasscode: false });
    }

    if (!share.passcode_hash) {
      return NextResponse.json({ ok: false, error: "Passcode misconfigured" }, { status: 500 });
    }

    const incomingHash = hashPasscode(passcode);
    const matches = comparePasscodeHashes(incomingHash, share.passcode_hash);

    if (!matches) {
      return NextResponse.json({ ok: false, error: "Invalid passcode" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, requiresPasscode: false });
    res.cookies.set(`${SHARE_PASSCODE_COOKIE_PREFIX}${id}`, share.passcode_hash, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: HOUR,
    });
    return res;
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

