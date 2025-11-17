import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPasscode } from "@/lib/shares";

type ShareAccess = "public" | "passcode";

interface ShareCreateBody {
  docId?: string;
  doc_id?: string;
  access?: ShareAccess;
  passcodeHash?: string;
  passcode?: string;
}

function isShareCreateBody(input: unknown): input is ShareCreateBody {
  if (!input || typeof input !== "object") {
    return false;
  }
  const candidate = input as ShareCreateBody;
  const maybeString = (value: unknown) => typeof value === "string" || value === undefined;
  const maybeAccess = (value: unknown) =>
    value === undefined || value === "public" || value === "passcode";

  return (
    maybeString(candidate.docId) &&
    maybeString(candidate.doc_id) &&
    maybeString(candidate.passcodeHash) &&
    maybeString(candidate.passcode) &&
    maybeAccess(candidate.access)
  );
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!isShareCreateBody(rawBody)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const docId = rawBody.docId ?? rawBody.doc_id;
    if (!docId) {
      return NextResponse.json({ ok: false, error: "Missing docId" }, { status: 400 });
    }

    const normalizedHash =
      typeof rawBody.passcodeHash === "string" && rawBody.passcodeHash.length > 0
        ? rawBody.passcodeHash
        : typeof rawBody.passcode === "string" && rawBody.passcode.trim().length > 0
          ? hashPasscode(rawBody.passcode.trim())
          : null;

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const access: ShareAccess = rawBody.access ?? (normalizedHash ? "passcode" : "public");

    const { data: share, error: createError } = await supa
      .from("shares")
      .insert({
        doc_id: docId,
        access,
        passcode_hash: normalizedHash,
        passcode_required: Boolean(normalizedHash),
        created_by: null,
      })
      .select("id")
      .single();

    if (createError || !share) {
      return NextResponse.json(
        { ok: false, error: createError?.message || "Failed to create share" },
        { status: 500 }
      );
    }

    await supa.from("events").insert({
      doc_id: docId,
      event_type: "share_created",
      meta_json: { access },
    });

    return NextResponse.json({ ok: true, id: share.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create share";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
