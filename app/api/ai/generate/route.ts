import type { GenOptions, Triage } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { logServerEvent, logServerError } from "@/lib/telemetry-server";
import OpenAI from "openai";

type GeneratePayload = {
  prompt: string;
  options?: GenOptions;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const TRIAGE_DESCRIPTIONS: Record<Triage, string> = {
  contract: "Formal business or legal agreement requiring precise clauses.",
  deck: "Presentation-style content that should be concise and scannable.",
  generic: "General business communication or memo.",
};

function isGeneratePayload(value: unknown): value is GeneratePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as { prompt?: unknown; options?: unknown };
  if (typeof payload.prompt !== "string") return false;
  if (payload.options && typeof payload.options !== "object") return false;
  return true;
}

function clampTokens(requested?: number) {
  const fallback = 1200;
  if (typeof requested !== "number" || Number.isNaN(requested)) return fallback;
  return Math.max(400, Math.min(2000, Math.round(requested)));
}

function buildMessages(prompt: string, options: GenOptions = {}): ChatMessage[] {
  const tone = options.tone ?? "neutral";
  const triage = options.triage ?? "generic";

  const systemParts = [
    "You are Harmonyk's AI drafting assistant.",
    "Produce clean, professional Markdown suitable for direct rendering as HTML.",
    TRIAGE_DESCRIPTIONS[triage],
    tone === "formal"
      ? "Maintain a formal, precise tone."
      : tone === "casual"
        ? "You may use a more conversational tone while remaining professional."
        : "Maintain a neutral, business-ready tone.",
    "Avoid meta commentary and do not output placeholders like ```.",
  ];

  const userParts = [
    options.templateId ? `Template ID: ${options.templateId}` : null,
    options.docId ? `Existing document ID: ${options.docId}` : null,
    `Document type: ${triage}`,
    "Draft requirements:",
    prompt,
  ].filter(Boolean);

  return [
    { role: "system", content: systemParts.join(" ") },
    { role: "user", content: userParts.join("\n\n") },
  ];
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  
  // Get auth context
  let auth: { userId: string | null; orgId: string | null } = { userId: null, orgId: null };
  try {
    const authContext = await getRouteAuthContext(req);
    auth = {
      userId: authContext.userId,
      orgId: authContext.orgId,
    };
  } catch {
    // Continue without auth for telemetry
  }

  if (!process.env.OPENAI_API_KEY) {
    const durationMs = performance.now() - startedAt;
    logServerError({
      event: "builder_generate",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Missing OpenAI configuration"),
    });
    return NextResponse.json(
      { error: "Missing OpenAI configuration" },
      { status: 500 }
    );
  }

  let payloadRaw: unknown;
  try {
    payloadRaw = await req.json();
  } catch {
    const durationMs = performance.now() - startedAt;
    logServerError({
      event: "builder_generate",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Invalid JSON body"),
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isGeneratePayload(payloadRaw)) {
    const durationMs = performance.now() - startedAt;
    logServerError({
      event: "builder_generate",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Request must include a prompt string"),
    });
    return NextResponse.json(
      { error: "Request must include a prompt string." },
      { status: 400 }
    );
  }

  const { prompt, options } = payloadRaw;
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    const durationMs = performance.now() - startedAt;
    logServerError({
      event: "builder_generate",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Prompt cannot be empty"),
    });
    return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: options?.tone === "casual" ? 0.5 : options?.tone === "formal" ? 0.1 : 0.2,
      max_tokens: clampTokens(options?.maxTokens),
      messages: buildMessages(normalizedPrompt, options),
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      const durationMs = performance.now() - startedAt;
      logServerError({
        event: "builder_generate",
        userId: auth.userId,
        orgId: auth.orgId,
        source: "builder",
        route: "/api/ai/generate",
        durationMs,
        properties: {
          status: "error",
        },
        error: new Error("Empty AI response"),
      });
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    const durationMs = performance.now() - startedAt;
    logServerEvent({
      event: "builder_generate",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate",
      durationMs,
      properties: {
        status: "ok",
        model: "gpt-4o-mini",
        content_length: content.length,
        has_template: !!options?.templateId,
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    const message = error instanceof Error ? error.message : "AI generation failed";
    
    logServerError({
      event: "builder_generate",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate",
      durationMs,
      properties: {
        status: "error",
      },
      error,
    });
    
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

