"use server";

import { TEMPLATES } from "@/data/templates";
import { buildMonoPreferenceConfig, getMonoProfiles, recordTemplateUsage } from "@/lib/mono/memory";
import { buildMonoAwareSystemPrompt, formatMonoPreferenceConfigForDebug } from "@/lib/mono/prompt";
import type { MonoBuilderType } from "@/lib/mono/types";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import fs from "fs";
import OpenAI from "openai";
import path from "path";

type CreateArgs = { templateId: string; prompt: string; userId: string };

export async function createDocFromTemplate({ templateId, prompt, userId }: CreateArgs) {
  const tmpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tmpl) return { error: "Unknown template" };

  // 1) Generate body (AI if key present, else static)
  let body = `# ${tmpl.name}\n\nGenerated draft based on: ${tmpl.description}\n\n---\n\n${prompt}\n\n`;
  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Base system prompt for contracts
    const baseSystemPrompt = `Draft a concise, business-ready ${tmpl.name}.
Guidance:
- Use neutral labels ("Party A", "Party B") unless roles are provided.
- Include headings and numbered clauses where appropriate.
- Insert placeholders like [ADDRESS], [AMOUNT], [DATE] when info is missing.`;

    // Get Mono preferences and build Mono-aware system prompt
    const profiles = await getMonoProfiles();
    const prefs = buildMonoPreferenceConfig(profiles);
    const systemPrompt = buildMonoAwareSystemPrompt(baseSystemPrompt, prefs);

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(formatMonoPreferenceConfigForDebug(prefs));
    }

    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Context/requirements:
${prompt}`,
        },
      ],
    });
    body = r.choices[0]?.message?.content || body;
  }

  // 2) Ensure /public/generated exists and write file
  const id = randomUUID();
  const fileName = `${id}.md`;
  const publicDir = path.join(process.cwd(), "public", "generated");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, fileName), body, "utf8");

  // 3) Insert into Supabase: documents + versions(1)
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const title = `${tmpl.name} — ${new Date().toISOString().slice(0, 10)}`;

  const { data: doc, error: e1 } = await supa
    .from("documents")
    .insert({ owner_id: userId, title, status: "draft" })
    .select("id")
    .single();
  if (e1) return { error: e1.message };

  const contentUrl = `/generated/${fileName}`;
  const { error: e2 } = await supa
    .from("versions")
    .insert({ doc_id: doc.id, number: 1, content_url: contentUrl });
  if (e2) return { error: e2.message };

  // Log Mono template usage (fire-and-forget)
  try {
    const builderType: MonoBuilderType = "contract";
    await recordTemplateUsage({
      userId,
      orgId: null,
      builderType,
      templateKey: templateId,
      clauseKey: null,
      source: "ai",
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[mono] recordTemplateUsage failed (non-blocking)", err);
    }
  }

  return { ok: true, docId: doc.id, version: 1, contentUrl };
}
