import type { MonoContext } from "@/components/mono/mono-pane";
import { logMonoQuery } from "@/lib/activity-log";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { buildMonoPreferenceConfigFromInput, getRecentMonoMessages } from "@/lib/mono/memory";
import { searchRag } from "@/lib/rag";
import { logServerError, logServerEvent } from "@/lib/telemetry-server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  
  try {
    const {
      isAuthenticated,
      userId,
      orgId,
      ownerId,
      supabase,
    } = await getRouteAuthContext(req);

    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required",
          details: null,
        },
        { status: 401 }
      );
    }

    if (!orgId) {
      console.error("[mono] query error: failed to get or create org", { userId });
      return NextResponse.json(
        { ok: false, error: "Failed to initialize workspace. Please try again.", details: null },
        { status: 500 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Maestro is not configured yet in this build.",
          details: null,
        },
        { status: 503 }
      );
    }

    const rawBody = (await req.json().catch(() => null)) as unknown;

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body", details: null },
        { status: 400 },
      );
    }

    const { message, context } = rawBody as { message?: string; context?: MonoContext };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Message is required",
          details: null,
        },
        { status: 400 }
      );
    }

    // Log mono_query event (best-effort, don't fail on logging errors)
    try {
      const logStartedAt = performance.now();
      await logMonoQuery({
        orgId,
        userId,
        ownerId: ownerId ?? null,
        message: message.trim(),
        context: {
          route: context?.route || "unknown",
          selectedDocumentId: context?.selectedDocumentId || null,
          selectedUnifiedItemId: context?.selectedUnifiedItemId || null,
          filters: context?.filters || {},
        },
        source: "mono",
        triggerRoute: "/api/mono",
        durationMs: performance.now() - logStartedAt,
      });
    } catch (logError) {
      console.error("[mono] failed to log mono_query", logError);
    }

    const baseSystemPrompt =
      "You are Maestro, Harmonyk's AI assistant. Answer the user's questions helpfully and concisely.";

    // Maestro preference config (org/user tone, risk profile, etc.)
    const preferenceConfig = buildMonoPreferenceConfigFromInput();
    const preferenceInstructionLines = [
      "Apply these conversational preferences where helpful:",
      `- Tone: ${preferenceConfig.tone}`,
      `- Risk profile: ${preferenceConfig.riskProfile}`,
      `- Jurisdiction: ${preferenceConfig.jurisdiction}`,
      `- Locale: ${preferenceConfig.locale}`,
    ];
    const preferenceInstruction = preferenceInstructionLines.join("\n");

    // Recent conversation memory (last N mono_query events)
    const recentMessages = await getRecentMonoMessages({
      supabase,
      orgId,
      userId,
      limit: 6,
    }).catch(() => []);

    // Get RAG context if a document is selected
    let ragContextText: string | null = null;
    const documentId =
      context?.selectedDocumentId || context?.selectedUnifiedItemId || null;

    if (documentId && typeof documentId === "string") {
      try {
        const ragResults = await searchRag(message.trim(), {
          filters: { documentId },
          limit: 6,
        });

        if (ragResults.length > 0) {
          const snippets = ragResults.map((result, index) => {
            const snippet = result.chunk.content;
            return `(${index + 1}) ${snippet}`;
          });

          ragContextText = [
            "Relevant excerpts from the document:",
            "",
            ...snippets,
          ].join("\n");
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[rag] searchRag failed (non-blocking)", err);
        }
      }
    }

    const systemSections: string[] = [baseSystemPrompt.trim(), "", preferenceInstruction];

    if (ragContextText) {
      systemSections.push(
        "",
        "RAG CONTEXT (currently informational only; RAG is disabled at GA):",
        ragContextText,
      );
    }

    if (recentMessages.length > 0) {
      const historyPreview = recentMessages
        .slice(-3)
        .map((m) => `- ${m.role}: ${m.content.slice(0, 120)}`)
        .join("\n");

      systemSections.push(
        "",
        "Recent Maestro conversation snippets (for continuity):",
        historyPreview,
      );
    }

    const systemContent = systemSections.join("\n");

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MONO_MODEL ?? "gpt-4.1-mini";

    const messagesForModel: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemContent },
    ];

    for (const m of recentMessages) {
      messagesForModel.push({
        role: m.role,
        content: m.content,
      });
    }

    messagesForModel.push({
      role: "user",
      content: message.trim(),
    });

    const completion = await openai.chat.completions.create({
      model,
      messages: messagesForModel,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I was unable to generate a response. Please try rephrasing your question.";

    const durationMs = performance.now() - startedAt;
    
    logServerEvent({
      event: "mono_chat",
      userId,
      orgId,
      docId: context?.selectedDocumentId ?? context?.selectedUnifiedItemId ?? null,
      source: "mono",
      route: "/api/mono",
      durationMs,
      properties: {
        status: "ok",
        has_context: !!context,
        context_route: context?.route ?? null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        reply,
        actions: [],
      },
      { status: 200 }
    );
  } catch (error) {
    const durationMs = performance.now() - startedAt;

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error("[mono] query error: unhandled exception", {
      error,
      message: errorMessage,
    });

    // Try to get auth context for error logging
    let authUserId: string | null = null;
    let authOrgId: string | null = null;
    try {
      const authContext = await getRouteAuthContext(req);
      authUserId = authContext.userId;
      authOrgId = authContext.orgId;
    } catch {
      // Ignore auth errors in error handler
    }

    logServerError({
      event: "mono_chat",
      userId: authUserId,
      orgId: authOrgId,
      source: "mono",
      route: "/api/mono",
      durationMs,
      properties: {
        status: "error",
      },
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        error: `Maestro failed: ${errorMessage}`,
        details: null,
      },
      { status: 500 }
    );
  }
}

