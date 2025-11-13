import { NextResponse } from "next/server";
import { saveItem } from "../_store";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({} as any));
        const { title, html, markdown } = body ?? {};

        if (!title || (!html && !markdown)) {
            return NextResponse.json({ error: "title and (html|markdown) required" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        if (typeof html === "string") {
            saveItem({ id, title, html });
        } else {
            saveItem({ id, title, markdown });
        }

        // Return both id and a ready-to-open relative URL
        return NextResponse.json({ id, url: `/share/${id}` }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
}
