import { NextResponse } from "next/server";
import { putShare } from "../_store";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null) as { title: string; html?: string; markdown?: string } | null;
    if (!body?.title || (!body.html && !body.markdown)) {
        return NextResponse.json({ ok: false, reason: "bad_input" }, { status: 400 });
    }
    const id = Math.random().toString(36).slice(2, 10);
    putShare({ id, title: body.title, html: body.html, markdown: body.markdown });
    return NextResponse.json({ ok: true, shareId: id, url: `/share/${id}` });
}
