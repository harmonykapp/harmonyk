import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { logServerEvent, logServerError } from "@/lib/telemetry-server";
import OpenAI from "openai";

type DeckType = "fundraising" | "investor_update";

type DeckGenerationSectionInput = {
  sectionKey: string;
  title: string;
  order: number;
};

type DeckCompanyInfo = {
  companyName: string;
  stage?: string;
  roundSize?: string;
  keyMetrics?: string;
};

type DeckGenerationRequest = {
  deckType: DeckType;
  outline: DeckGenerationSectionInput[];
  companyInfo: DeckCompanyInfo;
};

type DeckGeneratedSection = {
  sectionKey: string;
  title: string;
  content: string;
};

type DeckGenerationResponse = {
  sections: DeckGeneratedSection[];
};

function isDeckGenerationRequest(value: unknown): value is DeckGenerationRequest {
  if (!value || typeof value !== "object") return false;
  const payload = value as {
    deckType?: unknown;
    outline?: unknown;
    companyInfo?: unknown;
  };
  if (payload.deckType !== "fundraising" && payload.deckType !== "investor_update") return false;
  if (!Array.isArray(payload.outline)) return false;
  if (!payload.companyInfo || typeof payload.companyInfo !== "object") return false;
  const info = payload.companyInfo as { companyName?: unknown };
  return typeof info.companyName === "string" && info.companyName.trim().length > 0;
}

function buildDeckPrompt(request: DeckGenerationRequest): string {
  const { deckType, outline, companyInfo } = request;

  const deckTypeDescription =
    deckType === "fundraising"
      ? "fundraising deck for seed or pre-seed rounds. Focus on problem, solution, market opportunity, traction, business model, team, and funding ask."
      : "investor update deck for existing investors. Focus on progress since last update, key metrics, product updates, growth, roadmap, and asks for support.";

  const companyParts = [
    `Company: ${companyInfo.companyName}`,
    companyInfo.stage ? `Stage: ${companyInfo.stage}` : null,
    companyInfo.roundSize ? `Round Size: ${companyInfo.roundSize}` : null,
    companyInfo.keyMetrics ? `Key Metrics: ${companyInfo.keyMetrics}` : null,
  ].filter(Boolean);

  const outlineParts = outline.map((section, idx) => {
    return `${idx + 1}. ${section.title} (key: ${section.sectionKey})`;
  });

  return `Generate a ${deckTypeDescription}

Company Information:
${companyParts.join("\n")}

Deck Outline (in order):
${outlineParts.join("\n")}

Instructions:
- Generate slide content for each section in the outline above.
- Return a JSON object where each key is a sectionKey and the value is the slide content for that section.
- Content should be concise, scannable, and suitable for presentation slides.
- Use bullet points and short paragraphs.
- Focus on actionable insights and clear messaging.
- For each section, return the content as a string that can be directly used in a slide.

Format your response as JSON with this structure:
{
  "${outline[0]?.sectionKey || "section1"}": "content for first section...",
  "${outline[1]?.sectionKey || "section2"}": "content for second section...",
  ...
}

Each content value should be markdown-formatted text suitable for slides.`;
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();

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
      event: "deck_generated",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate-deck",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Missing OpenAI configuration"),
    });
    return NextResponse.json({ error: "Missing OpenAI configuration" }, { status: 500 });
  }

  let payloadRaw: unknown;
  try {
    payloadRaw = await req.json();
  } catch {
    const durationMs = performance.now() - startedAt;
    logServerError({
      event: "deck_generated",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate-deck",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Invalid JSON body"),
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isDeckGenerationRequest(payloadRaw)) {
    const durationMs = performance.now() - startedAt;
    logServerError({
      event: "deck_generated",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate-deck",
      durationMs,
      properties: {
        status: "error",
      },
      error: new Error("Invalid request payload"),
    });
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const prompt = buildDeckPrompt(payloadRaw);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are Monolyth's AI deck generation assistant. Generate concise, presentation-ready slide content in JSON format. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      const durationMs = performance.now() - startedAt;
      logServerError({
        event: "deck_generated",
        userId: auth.userId,
        orgId: auth.orgId,
        source: "builder",
        route: "/api/ai/generate-deck",
        durationMs,
        properties: {
          status: "error",
        },
        error: new Error("Empty AI response"),
      });
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    // Parse JSON response
    let parsedResponse: Record<string, string>;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      const durationMs = performance.now() - startedAt;
      logServerError({
        event: "deck_generated",
        userId: auth.userId,
        orgId: auth.orgId,
        source: "builder",
        route: "/api/ai/generate-deck",
        durationMs,
        properties: {
          status: "error",
        },
        error: parseError instanceof Error ? parseError : new Error("Failed to parse AI response"),
      });
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    // Map parsed response to DeckGeneratedSection[]
    const sections: DeckGeneratedSection[] = payloadRaw.outline.map((sectionInput) => {
      const content = parsedResponse[sectionInput.sectionKey] || "";
      return {
        sectionKey: sectionInput.sectionKey,
        title: sectionInput.title,
        content: content.trim() || "",
      };
    });

    const totalContentLength = sections.reduce((sum, s) => sum + s.content.length, 0);

    const durationMs = performance.now() - startedAt;
    logServerEvent({
      event: "deck_generated",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate-deck",
      durationMs,
      properties: {
        status: "ok",
        deck_type: payloadRaw.deckType,
        section_count: sections.length,
        content_length: totalContentLength,
        has_key_metrics: !!payloadRaw.companyInfo.keyMetrics?.trim(),
      },
    });

    const response: DeckGenerationResponse = { sections };
    return NextResponse.json(response);
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    const message = error instanceof Error ? error.message : "Deck generation failed";

    logServerError({
      event: "deck_generated",
      userId: auth.userId,
      orgId: auth.orgId,
      source: "builder",
      route: "/api/ai/generate-deck",
      durationMs,
      properties: {
        status: "error",
      },
      error,
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

