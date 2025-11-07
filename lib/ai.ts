// lib/ai.ts
import OpenAI from "openai";

type Triage = {
  priority: "low" | "medium" | "high";
  labels: string[];
  suggested_next_action: string;
};
type Analysis = {
  summary: string;
  entities: string[];
  dates: string[]; // ISO strings if present
};

export async function aiAnalyze(input: {
  title: string;
  source: "Drive" | "Gmail";
  kind?: string;
  owner?: string;
  modified?: string;
  preview?: string;
}): Promise<
  | { error: string; triage: null; analysis: null; raw?: string }
  | { error: null; triage: Triage; analysis: Analysis }
> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY", triage: null, analysis: null };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system =
    "You are a strict JSON generator. Respond ONLY with a single JSON object, no prose, no markdown.";

  const user = `
Return a compact JSON object summarizing and triaging this item.

INPUT:
- Title: ${input.title}
- Source: ${input.source}
- Kind: ${input.kind ?? ""}
- Owner: ${input.owner ?? ""}
- Modified: ${input.modified ?? ""}
- Preview: ${input.preview ?? "(no body text; only metadata available)"}

REQUIREMENTS:
- JSON ONLY (no code fences or extra text)
- Shape:
{
  "triage": {
    "priority": "low" | "medium" | "high",
    "labels": string[],
    "suggested_next_action": string
  },
  "analysis": {
    "summary": string,
    "entities": string[],
    "dates": string[]   // ISO if any explicit deadlines or dates recognized
  }
}
  `.trim();

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" }, // <- force JSON mode
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  let text = res.choices[0]?.message?.content ?? "{}";

  // Clean common wrappers (just in case)
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(text);
    // Minimal shape check
    if (!parsed.triage || !parsed.analysis) throw new Error("missing keys");
    return { error: null, triage: parsed.triage, analysis: parsed.analysis };
  } catch (e) {
    // Log for debugging during dev; safe to keep
    console.warn("AI non-JSON or bad shape:", text);
    return { error: "AI returned non-JSON", triage: null, analysis: null, raw: text };
  }
}
