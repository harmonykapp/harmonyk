import { NextResponse } from "next/server";
import { getItem } from "../_store";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    const item = id ? getItem(id) : null;

    if (!item) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Return the saved payload (title + html|markdown)
    if ("html" in item) {
        return NextResponse.json({ title: item.title, html: item.html });
    }
    return NextResponse.json({ title: item.title, markdown: item.markdown });
}
