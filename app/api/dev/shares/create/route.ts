import { NextResponse } from "next/server";
import { saveItem } from "../_store";

type DevSharePayload = {
  title?: string;
  html?: string;
  markdown?: string;
};

function isDevSharePayload(value: unknown): value is DevSharePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as DevSharePayload;
  const maybeString = (input: unknown) => typeof input === "string" || input === undefined;
  return maybeString(payload.title) && maybeString(payload.html) && maybeString(payload.markdown);
}

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    if (!isDevSharePayload(raw)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { title, html, markdown } = raw;
    if (!title || (!html && !markdown)) {
      return NextResponse.json({ error: "title and (html|markdown) required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    if (typeof html === "string" && html.length > 0) {
      saveItem({ id, title, html });
    } else if (typeof markdown === "string") {
      saveItem({ id, title, markdown });
    }

    return NextResponse.json({ id, url: `/share/${id}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
