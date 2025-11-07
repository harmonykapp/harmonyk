/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { docId, access, passcodeHash } = await req.json();

    if (!docId) {
      return NextResponse.json({ ok: false, error: "Missing docId" }, { status: 400 });
    }

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert share row
    const { data: share, error: e1 } = await supa
      .from("shares")
      .insert({
        doc_id: docId,
        access: access ?? "public",
        passcode_hash: passcodeHash ?? null,
        created_by: null, // optional: set a real user id if you want
      })
      .select("id")
      .single();

    if (e1 || !share) {
      return NextResponse.json(
        { ok: false, error: e1?.message || "Failed to create share" },
        { status: 500 }
      );
    }

    // Optional: log event
    await supa.from("events").insert({
      doc_id: docId,
      event_type: "share_created",
      meta_json: { access: access ?? "public" },
    });

    return NextResponse.json({ ok: true, id: share.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
