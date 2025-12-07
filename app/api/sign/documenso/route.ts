// Manual test: from Workbench, pick a Vault-backed doc, click "Send for signature", fill recipient.
// Expect 200 with ok: true, envelope row in DB, send_for_signature activity, and Documenso shows the envelope.

import { logActivity } from "@/lib/activity-log";
import { getDocumensoClient } from "@/lib/documenso-client";
import { validateDocumensoConfig } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

interface SignRequestBody {
  unifiedItemId?: string; // From Workbench
  documentId?: string; // From Builder
  recipient: {
    email: string;
    name: string;
  };
}

async function getUserAndOrg(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  req: NextRequest
) {
  let userId: string | null = DEMO_OWNER_ID;
  let orgId: string | null = null;

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

  if (userId && userId !== DEMO_OWNER_ID) {
    const { data: memberships } = await supabase
      .from("member")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      orgId = memberships[0].org_id;
    } else {
      const { data: defaultOrg, error: orgError } = await supabase
        .from("org")
        .insert({ name: "My Workspace", plan: "free" })
        .select("id")
        .single();

      if (!orgError && defaultOrg) {
        orgId = defaultOrg.id;
        await supabase.from("member").insert({ org_id: orgId, user_id: userId, role: "owner" });
      }
    }
  }

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
        .insert({ name: "Demo Workspace", plan: "free" })
        .select("id")
        .single();

      if (demoOrg) {
        orgId = demoOrg.id;
      }
    }
  }

  return { userId, orgId };
}

// Helper to return a safe dev success response when no file is available (non-production only)
function handleNoFileAvailable(reason: string): NextResponse<{ ok: boolean; error?: string; envelopeId?: string }> {
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === "production";

  if (!isProduction) {
    console.warn(
      `[documenso] No file available for signature (${reason}); returning dev success response in non-production environment (NODE_ENV=${nodeEnv}).`,
    );
    return NextResponse.json(
      { ok: true, envelopeId: "dev-stub-envelope-no-file" },
      { status: 200 },
    );
  }

  console.log(`[documenso] No file available for signature (${reason}); returning 400 in production (NODE_ENV=${nodeEnv}).`);
  return NextResponse.json(
    { ok: false, error: "No file available for signature. Save this document to Vault first." },
    { status: 400 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignRequestBody;

    // Validate request body - support both unifiedItemId (Workbench) and documentId (Builder)
    const unifiedItemId = body.unifiedItemId;
    const documentId = (body as { documentId?: string }).documentId;

    if (!unifiedItemId && !documentId) {
      console.error("[sign/documenso] Missing identifier", {
        received: Object.keys(body),
        reason: "neither unifiedItemId nor documentId provided",
      });
      return NextResponse.json(
        { ok: false, error: "Missing required field: either unifiedItemId or documentId must be provided" },
        { status: 400 }
      );
    }

    if (!body.recipient?.email || !body.recipient?.name) {
      console.error("[sign/documenso] Missing recipient info", {
        hasEmail: !!body.recipient?.email,
        hasName: !!body.recipient?.name,
        reason: "recipient.email and recipient.name are required",
      });
      return NextResponse.json(
        { ok: false, error: "Missing required fields: recipient.email and recipient.name" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { userId, orgId } = await getUserAndOrg(supabase, req);

    if (!orgId) {
      console.error("[sign/documenso] Could not determine organization", {
        userId,
        reason: "no org_id found or created",
      });
      return NextResponse.json(
        { ok: false, error: "Could not determine organization" },
        { status: 500 }
      );
    }

    // Handle two paths: unifiedItemId (Workbench) or documentId (Builder)
    let resolvedDocumentId: string | null = null;
    let versionId: string | null = null;
    let documentTitle = "";
    let documentContent = "";
    let hasStoredFile = false;
    let resolvedUnifiedItemId: string | null = null;

    if (unifiedItemId) {
      // Path 1: Workbench - fetch unified_item first
      const { data: unifiedItem, error: itemError } = await supabase
        .from("unified_item")
        .select("id, title, document_id, source")
        .eq("id", unifiedItemId)
        .eq("org_id", orgId)
        .single();

      if (itemError || !unifiedItem) {
        console.error("[sign/documenso] Failed to fetch unified_item", {
          unifiedItemId,
          orgId,
          error: itemError,
          reason: itemError?.code === "PGRST116" ? "no unified_item row found" : "query error",
        });
        return NextResponse.json(
          { ok: false, error: "Unified item not found" },
          { status: 404 }
        );
      }

      resolvedDocumentId = unifiedItem.document_id;
      documentTitle = unifiedItem.title;
      resolvedUnifiedItemId = unifiedItem.id;
    } else if (documentId) {
      // Path 2: Builder - use documentId directly
      resolvedDocumentId = documentId;
      resolvedUnifiedItemId = null; // Builder doesn't use unified_item
    } else {
      console.error("[sign/documenso] No identifier provided", {
        hasUnifiedItemId: !!unifiedItemId,
        hasDocumentId: !!documentId,
        reason: "both identifiers are null/undefined",
      });
      return NextResponse.json(
        { ok: false, error: "No document identifier provided" },
        { status: 400 }
      );
    }

    if (resolvedDocumentId) {
      const { data: document, error: docError } = await supabase
        .from("document")
        .select("id, title, current_version_id")
        .eq("id", resolvedDocumentId)
        .eq("org_id", orgId)
        .single();

      if (docError || !document) {
        console.error("[sign/documenso] Document lookup failed", {
          documentId: resolvedDocumentId,
          orgId,
          error: docError,
          reason: "no document row found",
        });
        return handleNoFileAvailable("document not found");
      }

      documentTitle = document.title;
      versionId = document.current_version_id ?? null;

      if (versionId) {
        const { data: version, error: versionError } = await supabase
          .from("version")
          .select("id, content, storage_path")
          .eq("id", versionId)
          .single();

        if (versionError || !version) {
          console.error("[sign/documenso] Version lookup failed", {
            versionId,
            error: versionError,
            reason: "no version row found",
          });
          return handleNoFileAvailable("version not found");
        }

        // Check if we have content or storage path
        if (version.content) {
          documentContent = version.content;
          hasStoredFile = true;
        } else if (version.storage_path) {
          // If we have storage_path but no content, we could fetch it, but for now return error
          console.error("[sign/documenso] Version has storage_path but no content", {
            versionId,
            storage_path: version.storage_path,
            reason: "content not available in version row",
          });
          return handleNoFileAvailable("version has storage_path but no content");
        }
      }
    }

    // If unified_item has no document_id, it's not saved to Vault yet
    if (!resolvedDocumentId) {
      console.error("[sign/documenso] Unified item has no document_id", {
        unifiedItemId: resolvedUnifiedItemId,
        reason: "unified_item.document_id is null - item not saved to Vault",
      });
      return handleNoFileAvailable("unified_item has no document_id");
    }

    // If no document content found, return error
    if (!hasStoredFile) {
      console.error("[sign/documenso] No document content available", {
        documentId: resolvedDocumentId,
        versionId,
        reason: "no content in version row",
      });
      return handleNoFileAvailable("no content in version row");
    }

    // Validate Documenso config before attempting API call
    const configValidation = validateDocumensoConfig();
    if (!configValidation.valid) {
      console.error("[sign/documenso] Documenso configuration invalid", {
        errors: configValidation.errors,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Documenso is not properly configured",
          details: configValidation.errors.join("; "),
        },
        { status: 500 }
      );
    }

    // Call Documenso API to create envelope
    let documensoClient: ReturnType<typeof getDocumensoClient>;
    try {
      documensoClient = getDocumensoClient();
    } catch (clientError) {
      const errorMessage = clientError instanceof Error ? clientError.message : "Unknown error";
      console.error("[sign/documenso] Failed to create Documenso client", {
        error: clientError,
        message: errorMessage,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to initialize Documenso client",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // Documenso API: POST /api/v1/envelopes
    // Based on Documenso API docs, we need to send:
    // - title/name
    // - recipients array
    // - documents array with content
    const documensoPayload = {
      title: documentTitle,
      recipients: [
        {
          email: body.recipient.email,
          name: body.recipient.name,
          role: "signer",
        },
      ],
      documents: [
        {
          title: documentTitle,
          content: documentContent,
          format: "markdown", // or "html" if we detect HTML
        },
      ],
    };

    let providerEnvelopeId: string;
    let documensoResponse: unknown;

    try {
      documensoResponse = await documensoClient.request<{
        id: string;
        share_url?: string;
        status?: string;
        [key: string]: unknown;
      }>("/api/v1/envelopes", {
        method: "POST",
        body: documensoPayload,
      });

      providerEnvelopeId = (documensoResponse as { id: string }).id;

      console.log("[sign/documenso] Envelope created successfully", {
        providerEnvelopeId,
        documentId: resolvedDocumentId,
        recipientEmail: body.recipient.email,
      });
    } catch (apiError) {
      const errorMessage =
        apiError instanceof Error ? apiError.message : String(apiError);
      const statusCode =
        apiError &&
          typeof apiError === "object" &&
          "status" in apiError &&
          typeof (apiError as { status: number }).status === "number"
          ? (apiError as { status: number }).status
          : 500;

      // Check if it's a DocumensoError with details
      const errorDetails =
        apiError &&
          typeof apiError === "object" &&
          "details" in apiError
          ? (apiError as { details: unknown }).details
          : undefined;

      console.error("[sign/documenso] Documenso API error", {
        error: apiError,
        status: statusCode,
        message: errorMessage,
        details: errorDetails,
        documentId: resolvedDocumentId,
        recipientEmail: body.recipient.email,
      });

      // Provide a helpful error message based on status code
      let userMessage = "Failed to create envelope in Documenso";
      if (statusCode === 401 || statusCode === 403) {
        userMessage = "Documenso authentication failed. Please check your API token configuration.";
      } else if (statusCode === 404) {
        userMessage = "Documenso API endpoint not found. Please check your Documenso base URL configuration.";
      } else if (statusCode >= 500) {
        userMessage = "Documenso service error. Please try again later or check your Documenso configuration.";
      }

      return NextResponse.json(
        {
          ok: false,
          error: userMessage,
          details: errorMessage || (errorDetails ? String(errorDetails) : undefined),
        },
        { status: statusCode >= 400 && statusCode < 600 ? statusCode : 502 }
      );
    }

    // Insert envelope row
    const { data: envelope, error: envelopeError } = await supabase
      .from("envelope")
      .insert({
        org_id: orgId,
        document_id: resolvedDocumentId,
        version_id: versionId,
        provider: "documenso",
        provider_envelope_id: providerEnvelopeId,
        status: "sent",
        created_by: userId ?? DEMO_OWNER_ID,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (envelopeError || !envelope) {
      console.error("[sign/documenso] Failed to create envelope", envelopeError);
      return NextResponse.json(
        { ok: false, error: "Failed to create envelope record" },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await logActivity({
        orgId,
        userId: userId !== DEMO_OWNER_ID ? userId : null,
        type: "send_for_signature",
        documentId: resolvedDocumentId,
        versionId: versionId ?? null,
        unifiedItemId: resolvedUnifiedItemId,
        envelopeId: envelope.id,
        context: {
          provider: "documenso",
          envelope_id: envelope.id,
          provider_envelope_id: providerEnvelopeId,
          recipient_email: body.recipient.email,
          recipient_name: body.recipient.name,
          documenso_response: documensoResponse,
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails, but log it
      console.error("[sign/documenso] Failed to log activity", logError);
    }

    return NextResponse.json(
      {
        ok: true,
        envelopeId: envelope.id,
        providerEnvelopeId,
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    const errorName = err instanceof Error ? err.name : typeof err;

    console.error("[sign/documenso] Unexpected error", {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
      error: err,
    });

    // Provide more context in the error response
    const userFacingError = err instanceof Error
      ? (errorMessage || "An unexpected error occurred while sending for signature")
      : "An unexpected error occurred while sending for signature. Please check your Documenso configuration.";

    return NextResponse.json(
      {
        ok: false,
        error: userFacingError,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

