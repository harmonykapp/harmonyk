import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { logMonoQuery } from "@/lib/activity-log";
import { searchRag } from "@/lib/rag";
import { logServerEvent, logServerError } from "@/lib/telemetry-server";
import type { MonoContext } from "@/components/mono/mono-pane";

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  
  try {
    const { isAuthenticated, userId, orgId, ownerId } = await getRouteAuthContext(req);

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

    // Check if Mono/OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "Mono is not configured yet in this dev build.",
          details: null,
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const message = body.message as string | undefined;
    const context = body.context as MonoContext | undefined;

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

    // Base system prompt for Mono
    const baseSystemPrompt =
      "You are Mono, Monolyth's AI assistant. Answer the user's questions helpfully and concisely.";

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

    // Build system prompt with RAG context if available
    const systemContent = ragContextText
      ? `${baseSystemPrompt.trim()}

----
RAG CONTEXT
${ragContextText}`
      : baseSystemPrompt;

    // For now, return a stubbed response
    // TODO: Integrate with OpenAI client (same as Analyze) when ready
    // When OpenAI is integrated, use systemContent in the system message
    const reply = `Mono stub: I see you are on ${context?.route || "unknown"}. You asked: "${message.trim()}". This is a placeholder response. Real AI integration will be added in a future update.`;

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
    
    console.error("[mono] query error: unhandled exception", {
      error,
      message: (error as any)?.message,
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
        error: `Mono failed: ${(error as any)?.message ?? "unknown error"}`,
        details: null,
      },
      { status: 500 }
    );
  }
}

