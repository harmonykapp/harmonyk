// Manual test: run Analyze on any Workbench item. Expect 200 response and a new analyze_completed row in /dev/activity-log without FK errors.

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AnalyzeResultSchema, type AnalyzeResult } from "@/lib/ai/schemas";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logAnalyzeCompleted } from "@/lib/activity-log";
import { logServerEvent, logServerError } from "@/lib/telemetry-server";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set for Supabase admin client");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set for Supabase admin client");
}

// Admin client (service-role) for server-side writes such as ActivityLog.
// This bypasses RLS and must never be used on the client.
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

async function getUserAndOrg(req: NextRequest) {
  let userId: string | null = DEMO_OWNER_ID;
  let orgId: string | null = null;

  const supabase = createServerSupabaseClient();

  // Try to get user from auth session via cookies
  const cookieStore = await cookies();
  // Supabase stores auth in cookies with pattern: sb-<project-ref>-auth-token
  const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\./)?.[1] || "default";
  const authCookieName = `sb-${projectRef}-auth-token`;

  const authCookie = cookieStore.get(authCookieName);
  if (authCookie?.value) {
    try {
      const session = JSON.parse(authCookie.value);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Ignore parse errors, fall back to demo user
    }
  }

  // Get user's first org membership, or create a default org
  if (userId && userId !== DEMO_OWNER_ID) {
    const { data: memberships } = await supabase
      .from("member")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      orgId = memberships[0].org_id;
    } else {
      // Create a default org for the user if none exists
      const { data: defaultOrg, error: orgError } = await supabase
        .from("org")
        .insert({
          name: "My Workspace",
          plan: "free",
        })
        .select("id")
        .single();

      if (!orgError && defaultOrg) {
        orgId = defaultOrg.id;
        // Add user as owner
        await supabase.from("member").insert({
          org_id: orgId,
          user_id: userId,
          role: "owner",
        });
      }
    }
  }

  // For demo user, try to get or create a demo org
  if (!orgId) {
    const { data: demoOrgs } = await supabase
      .from("org")
      .select("id")
      .eq("name", "Demo Workspace")
      .limit(1);

    if (demoOrgs && demoOrgs.length > 0) {
      orgId = demoOrgs[0].id;
    } else {
      const { data: demoOrg } = await supabase
        .from("org")
        .insert({
          name: "Demo Workspace",
          plan: "free",
        })
        .select("id")
        .single();

      if (demoOrg) {
        orgId = demoOrg.id;
      }
    }
  }

  return { userId, orgId };
}

// Simple JSON Schema to match AnalyzeResultSchema
const analyzeResultJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    dates: {
      type: "array",
      items: { type: "string" },
    },
    nextAction: {
      type: ["string", "null"],
    },
  },
  required: ["summary", "entities", "dates", "nextAction"],
  additionalProperties: false,
} as const;

type AnalyzeRequestBody = {
  itemId: string;
  title: string;
  snippet: string;
  metadata?: Record<string, unknown>;
};

function logPosthogEvent(
  event: "ai_analyze_requested" | "ai_analyze_failed" | "ai_analyze_completed",
  payload: Record<string, unknown>,
) {
  console.log(`[telemetry] ${event}`, payload);
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  let snippetForFallback = "";

  const fallbackFromSnippet = (snippet: string) => ({
    summary: snippet.slice(0, 280),
    entities: [],
    dates: [],
    nextAction: null,
  });

  try {
    const { userId, orgId } = await getUserAndOrg(req);

    if (!orgId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Workspace not initialized for Analyze",
          details: null,
        },
        { status: 500 },
      );
    }

    const rawBody = (await req.json().catch(() => null)) as unknown;

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body",
          details: null,
        },
        { status: 400 },
      );
    }

    const { itemId, title, snippet, metadata } = rawBody as AnalyzeRequestBody;

    snippetForFallback = typeof snippet === "string" ? snippet : "";

    if (!itemId || !title || !snippet) {
      return NextResponse.json(
        {
          ok: false,
          error: "itemId, title, and snippet are required",
          details: null,
        },
        { status: 400 },
      );
    }

    const model = process.env.OPENAI_ANALYZE_MODEL ?? "gpt-4.1-mini";

    logPosthogEvent("ai_analyze_requested", {
      orgId,
      userId,
      itemId,
      model,
    });

    if (!openai) {
      // No API key configured – return a graceful fallback without calling OpenAI.
      const durationMsNoKey = performance.now() - startedAt;
      logPosthogEvent("ai_analyze_failed", { error: "OPENAI_API_KEY not set", stage: "no_key" });
      return NextResponse.json(
        {
          ok: true,
          result: fallbackFromSnippet(snippet),
          debug: { model, noKey: true, durationMs: durationMsNoKey },
        },
        { status: 200 },
      );
    }

    logServerEvent({
      event: "ai_analyze_requested",
      userId,
      orgId,
      docId: itemId,
      source: "ai_analyze",
      route: "/api/ai/analyze",
      properties: { model },
    });

    const metadataFragment =
      metadata && Object.keys(metadata).length > 0
        ? `Metadata (JSON):\n${JSON.stringify(metadata, null, 2)}\n\n`
        : "";

    const userPrompt = [
      "You are analyzing a short business document snippet for a startup founder.",
      "Return ONLY JSON. Do not include any prose or explanation outside the JSON object.",
      "",
      `Title: ${title}`,
      "",
      `Snippet:\n${snippet}`,
      "",
      metadataFragment,
      "Return a JSON object with this exact shape:",
      JSON.stringify(analyzeResultJsonSchema, null, 2),
    ].join("\n");

    // Default to a safe fallback result. We only improve it if the model call succeeds.
    let result: AnalyzeResult = fallbackFromSnippet(snippet);

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You analyze documents for Monolyth. Always respond with strict JSON matching the requested schema. Never include commentary.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const rawContent = completion.choices[0]?.message?.content ?? "{}";

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        parsed = fallbackFromSnippet(snippet);
      }

      const validated = AnalyzeResultSchema.safeParse(parsed);

      if (validated.success) {
        result = validated.data;
      } else {
        // Validation failed – keep fallback but log for debugging.
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[ai/analyze] validation failed, using fallback", {
            issues: validated.error.issues,
          });
        }
      }
    } catch (modelError) {
      const message =
        modelError instanceof Error ? modelError.message : String(modelError);

      // Do NOT throw – we want to return a best-effort result even if the model fails.
      logPosthogEvent("ai_analyze_failed", {
        error: message,
        stage: "openai_call",
      });

      logServerError({
        event: "ai_analyze_failed",
        userId,
        orgId,
        source: "ai_analyze",
        route: "/api/ai/analyze",
        durationMs: performance.now() - startedAt,
        properties: {
          stage: "openai_call",
          model,
        },
        error: modelError,
      });

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[ai/analyze] OpenAI call failed, using fallback", {
          message,
        });
      }
    }

    const durationMs = performance.now() - startedAt;

    await logAnalyzeCompleted({
      orgId,
      userId,
      unifiedItemId: itemId,
      documentId: (metadata?.documentId as string | undefined) ?? null,
      metadata: {
        title,
        model,
        snippetLength: snippet.length,
      },
      source: "ai_analyze",
      triggerRoute: "/api/ai/analyze",
      durationMs,
    });

    logPosthogEvent("ai_analyze_completed", {
      orgId,
      userId,
      itemId,
      durationMs,
    });

    logServerEvent({
      event: "ai_analyze_completed",
      userId,
      orgId,
      docId: itemId,
      source: "ai_analyze",
      route: "/api/ai/analyze",
      durationMs,
      properties: { model },
    });

    return NextResponse.json(
      {
        ok: true,
        result,
        debug: {
          model,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    try {
      logPosthogEvent("ai_analyze_failed", {
        error: message,
        stage: "handler",
      });

      logServerError({
        event: "ai_analyze_failed",
        userId: null,
        orgId: null,
        source: "ai_analyze",
        route: "/api/ai/analyze",
        durationMs,
        properties: {
          stage: "handler",
        },
        error,
      });
    } catch {
      // Swallow logging errors; we still want to return a response.
    }

    const safeResult = fallbackFromSnippet(
      snippetForFallback || "Analyze failed. No snippet available.",
    );

    return NextResponse.json(
      {
        ok: true,
        result: safeResult,
        error: "Analyze failed",
        details: message,
        debug: {
          durationMs,
          stage: "handler",
        },
      },
      { status: 200 },
    );
  }
}

