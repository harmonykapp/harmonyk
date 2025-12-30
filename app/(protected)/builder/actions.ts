"use server";

import { TEMPLATES } from "@/data/templates";
import { buildMonoPreferenceConfig, getMonoProfiles, recordTemplateUsage } from "@/lib/mono/memory";
import { buildMonoAwareSystemPrompt, formatMonoPreferenceConfigForDebug } from "@/lib/mono/prompt";
import type { MonoBuilderType } from "@/lib/mono/types";
import { getDefaultOrgIdForUser } from "@/lib/org/get-default-org-id";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/supabase/database.types";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "crypto";
import fs from "fs";
import { cookies } from "next/headers";
import OpenAI from "openai";
import path from "path";

type CreateArgs = { templateId: string; prompt: string; userId: string };

export async function createDocFromTemplate({ templateId, prompt, userId }: CreateArgs) {
  const tmpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tmpl) return { error: "Unknown template" };

  // Auth: derive user from session cookies (don't trust caller-provided userId).
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { error: "Server misconfigured: missing Supabase env vars" };
  }

  const sessionClient = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookieList: Array<{ name: string; value: string; options?: any }>) => {
        for (const c of cookieList) cookieStore.set(c.name, c.value, c.options);
      },
    },
  });

  const { data: authData, error: authErr } = await sessionClient.auth.getUser();
  const authUser = authData?.user ?? null;
  if (authErr || !authUser) return { error: "Not authenticated" };
  if (userId && userId !== authUser.id) return { error: "Invalid user session" };
  const ownerId = authUser.id;

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

    // Get Maestro preferences and build Maestro-aware system prompt
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

  // 2) Best-effort: write a dev-only file (Vercel/serverless FS is not reliable).
  const id = randomUUID();
  const fileName = `${id}.md`;
  let contentUrl: string | null = null;
  try {
    if (process.env.NODE_ENV !== "production") {
      const publicDir = path.join(process.cwd(), "public", "generated");
      fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(path.join(publicDir, fileName), body, "utf8");
      contentUrl = `/generated/${fileName}`;
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[builder/actions] Failed to write /public/generated (ignored)", err);
    }
  }

  // 3) Insert into Supabase: document + version(1)
  // IMPORTANT: canonical schema requires org_id everywhere.
  const admin = createServerSupabaseClient();
  const orgId = await getDefaultOrgIdForUser(ownerId);
  if (!orgId) return { error: "User has no org membership (member row missing)." };

  const title = `${tmpl.name} — ${new Date().toISOString().slice(0, 10)}`;

  const { data: doc, error: e1 } = await admin
    .from("document")
    .insert({
      org_id: orgId,
      owner_id: ownerId,
      title,
      status: "draft",
      kind: "contract",
    })
    .select("id")
    .single();
  if (e1) return { error: e1.message };
  if (!doc) return { error: "Failed to create document" };

  const content = body;
  const { data: v1, error: e2 } = await admin
    .from("version")
    .insert({
      org_id: orgId,
      created_by: ownerId,
      document_id: doc.id,
      number: 1,
      content,
      title,
    })
    .select("id")
    .single();
  if (e2) return { error: e2.message };
  if (!v1?.id) return { error: "Failed to create version" };

  // Set current_version_id for sane downstream logic (shares/render/envelopes/etc).
  const { error: e3 } = await admin
    .from("document")
    .update({ current_version_id: v1.id })
    .eq("id", doc.id);
  if (e3) return { error: e3.message };

  // Log Maestro template usage (fire-and-forget)
  try {
    const builderType: MonoBuilderType = "contract";
    await recordTemplateUsage({
      userId: ownerId,
      orgId,
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
