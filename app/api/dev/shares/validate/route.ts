import { NextResponse } from "next/server";
import { getShare } from "../../../shares/_store";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    const rec = id ? getShare(id) : null;
    return NextResponse.json({ ok: !!rec }, { status: rec ? 200 : 404 });
}
