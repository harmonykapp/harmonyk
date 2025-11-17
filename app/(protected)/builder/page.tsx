import fs from "node:fs/promises";
import path from "node:path";
import BuilderClient from "@/components/builder/BuilderClient";
import { TEMPLATES, type TemplateDef } from "@/data/templates";
import { supabaseServer } from "@/lib/supabase-server";

type BuilderTemplate = TemplateDef;

type InitialDoc = {
  id: string;
  title: string;
  templateId?: string;
  content: string;
  versionNumber?: number;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const docId = Array.isArray(sp?.docId) ? sp?.docId[0] : (sp?.docId as string | undefined);
  const templates = TEMPLATES as BuilderTemplate[];
  const initialDoc = docId ? await loadInitialDoc(docId) : null;

  return <BuilderClient templates={templates} initialDoc={initialDoc} />;
}

async function loadInitialDoc(docId: string): Promise<InitialDoc | null> {
  const supabase = supabaseServer();
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, title, template_id")
    .eq("id", docId)
    .maybeSingle();

  if (docError || !doc) {
    return null;
  }

  const { data: version, error: versionError } = await supabase
    .from("versions")
    .select("number, content_md, content_url")
    .eq("doc_id", docId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError || !version) {
    return null;
  }

  let content = version.content_md ?? "";
  if (!content && version.content_url) {
    const filePath = path.join(
      process.cwd(),
      "public",
      version.content_url.replace(/^\/+/, "")
    );
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      content = "";
    }
  }

  return {
    id: doc.id as string,
    title: doc.title as string,
    templateId: (doc as { template_id?: string | null }).template_id ?? undefined,
    content,
    versionNumber: version.number ?? 1,
  };
}
