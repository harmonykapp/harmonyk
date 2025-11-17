import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type RequestBody = {
  docId?: string;
  templateId?: string;
  title?: string;
  content?: string;
};

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const markdown = typeof body.content === "string" ? body.content.trim() : "";
    if (!markdown) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const supabase = supabaseServer();
    const fileId = randomUUID();
    const fileName = `${fileId}.md`;
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    await fs.writeFile(path.join(GENERATED_DIR, fileName), markdown, "utf8");
    const contentUrl = `/generated/${fileName}`;

    const finalTitle = (body.title ?? "").trim() || "Untitled document";
    const templateId = body.templateId?.trim() || undefined;

    let docId = body.docId?.trim() || "";
    if (docId) {
      const { data: existingDoc, error: existingErr } = await supabase
        .from("documents")
        .select("id")
        .eq("id", docId)
        .maybeSingle();

      if (existingErr || !existingDoc) {
        return NextResponse.json({ error: "Document not found." }, { status: 404 });
      }

      const updatePayload: Record<string, unknown> = { title: finalTitle };
      if (templateId) {
        updatePayload.template_id = templateId;
      }
      await supabase.from("documents").update(updatePayload).eq("id", docId);
    } else {
      docId = await createDocument({
        supabase,
        title: finalTitle,
        templateId,
      });
    }

    const versionNumber = await createVersion({
      supabase,
      docId,
      contentUrl,
      markdown,
    });

    return NextResponse.json({
      docId,
      versionNumber,
      templateId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save the document version.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function createDocument({
  supabase,
  title,
  templateId,
}: {
  supabase: ReturnType<typeof supabaseServer>;
  title: string;
  templateId?: string;
}): Promise<string> {
  const payload: Record<string, unknown> = {
    owner_id: DEMO_OWNER_ID,
    title,
    status: "draft",
  };
  if (templateId) {
    payload.template_id = templateId;
  }

  let { data, error } = await supabase.from("documents").insert(payload).select("id").single();

  if (error && templateId && isUnknownColumnError(error.message, "template_id")) {
    const fallbackPayload = {
      owner_id: DEMO_OWNER_ID,
      title,
      status: "draft",
    };
    ({ data, error } = await supabase.from("documents").insert(fallbackPayload).select("id").single());
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create document.");
  }

  return data.id as string;
}

async function createVersion({
  supabase,
  docId,
  contentUrl,
  markdown,
}: {
  supabase: ReturnType<typeof supabaseServer>;
  docId: string;
  contentUrl: string;
  markdown: string;
}): Promise<number> {
  const { data: latestVersion } = await supabase
    .from("versions")
    .select("number")
    .eq("doc_id", docId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (latestVersion?.number ?? 0) + 1;

  const versionPayload: Record<string, unknown> = {
    doc_id: docId,
    number: nextNumber,
    content_url: contentUrl,
    content_md: markdown,
  };

  let { error } = await supabase.from("versions").insert(versionPayload).select("id").single();

  if (error && isUnknownColumnError(error.message, "content_md")) {
    const fallbackPayload = {
      doc_id: docId,
      number: nextNumber,
      content_url: contentUrl,
    };
    ({ error } = await supabase.from("versions").insert(fallbackPayload).select("id").single());
  }

  if (error) {
    throw new Error(error.message);
  }

  return nextNumber;
}

function isUnknownColumnError(message: string | undefined, column: string) {
  if (!message) return false;
  return message.toLowerCase().includes(column.toLowerCase());
}

