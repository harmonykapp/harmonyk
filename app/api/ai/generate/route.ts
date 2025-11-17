import type { GenOptions, Triage } from "@/lib/ai";
import { NextResponse } from "next/server";
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
    "You are Monolyth's AI drafting assistant.",
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

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OpenAI configuration" },
      { status: 500 }
    );
  }

  let payloadRaw: unknown;
  try {
    payloadRaw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isGeneratePayload(payloadRaw)) {
    return NextResponse.json(
      { error: "Request must include a prompt string." },
      { status: 400 }
    );
  }

  const { prompt, options } = payloadRaw;
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
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
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

