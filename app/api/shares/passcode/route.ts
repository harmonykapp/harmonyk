import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/supabase/database.types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

type ShareLinkRow = Database["public"]["Tables"]["share_link"]["Row"];
type ShareLinkRowWithPasscode = ShareLinkRow & { passcode_hash?: string | null };

async function getShareByTokenOrId(
  admin: ReturnType<typeof createServerSupabaseClient>,
  idOrToken: string
) {
  const { data, error } = await admin
    .from("share_link")
    .select("*")
    .or(`token.eq.${idOrToken},id.eq.${idOrToken}`)
    .maybeSingle<ShareLinkRowWithPasscode>();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { id?: string; passcode?: string }
      | null;

    const idOrToken = body?.id?.trim() ?? "";
    const passcode = body?.passcode?.trim() ?? "";

    if (!idOrToken) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (!passcode) return NextResponse.json({ error: "Passcode required" }, { status: 400 });

    const admin = createServerSupabaseClient();
    const share = await getShareByTokenOrId(admin, idOrToken);
    if (!share) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storedHash = (share as ShareLinkRowWithPasscode).passcode_hash ?? null;

    // If this link isn't configured for passcodes, don't unlock it.
    // (We still allow plain public shares to render without using this endpoint.)
    if (!storedHash) {
      return NextResponse.json(
        { error: "This link is not configured for passcode access." },
        { status: 400 },
      );
    }

    const submittedHash = createHash("sha256").update(passcode, "utf8").digest("hex");
    if (submittedHash !== storedHash) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(`share_unlocked_${share.id}`, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Passcode failed" }, { status: 500 });
  }
}
