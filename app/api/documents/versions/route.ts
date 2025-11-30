// Canonical Save-to-Vault backend:
// - Workbench: saves existing unified items into the document table.
// - Builder: creates unified item (if needed) + document.
// Uses the same owner_id/org_id/user_id pattern as existing document inserts,
// so foreign keys pass and rows appear on /vault.

import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logDocSavedToVault, logDocGenerated } from "@/lib/activity-log";
import { logServerEvent, logServerError } from "@/lib/telemetry-server";

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  
  try {
    // Get authenticated user context using unified route auth helper
    const { isAuthenticated, userId, orgId, ownerId, supabase: supabaseAdmin } = await getRouteAuthContext(req);

    // Auth gate: require authenticated user
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

    // org_id is required by the document table schema, but getRouteAuthContext creates one if needed
    // If orgId is still null, it means org creation failed
    if (!orgId) {
      console.error("[vault] save error: failed to get or create org", { userId });
      return NextResponse.json(
        { ok: false, error: "Failed to initialize workspace. Please try again.", details: null },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as any));

    const unifiedItemId = body.unifiedItemId as string | undefined;
    const titleFromBody = body.title as string | undefined;
    const contentFromBody = body.content as string | undefined;
    const templateId = body.templateId as string | undefined;
    const kindFromBody = (body.kind as string | undefined) ?? "contract"; // Default to "contract" for backward compatibility
    const metadataFromBody = body.metadata as Record<string, unknown> | undefined;

    // Use actual table names from Database schema
    const unifiedItemTable = "unified_item";
    const documentsTable = "document";

    // owner_id must reference auth.users(id) - use ownerId from route auth context (which is userId)
    // This matches the pattern in app/api/sign/documenso/route.ts: owner_id: userId
    let effectiveOwnerId: string;
    let effectiveOrgId: string;
    let effectiveUserId: string;

    let finalUnifiedItemId: string;
    let finalTitle: string;

    if (unifiedItemId) {
      // Workbench mode: Save an existing unified item to Vault
      const { data: unifiedItem, error: unifiedItemError } = await supabaseAdmin
        .from(unifiedItemTable)
        .select("id, org_id, title")
        .eq("id", unifiedItemId)
        .maybeSingle();

      if (unifiedItemError) {
        console.error("[vault] save error: unified_item lookup failed", {
          unifiedItemId,
          message: unifiedItemError.message,
          code: unifiedItemError.code,
          details: unifiedItemError.details,
        });
        return NextResponse.json(
          {
            ok: false,
            error: `Unified item lookup failed: ${unifiedItemError.message}`,
            details: {
              message: unifiedItemError.message,
              code: unifiedItemError.code,
              details: unifiedItemError.details,
            },
          },
          { status: 400 }
        );
      }

      if (!unifiedItem) {
        // Unified item doesn't exist - create it (Workbench may have mock data)
        // Use title from body or a default
        const newTitle = titleFromBody ?? "Untitled document";
        
        const newUnifiedItemPayload: any = {
          org_id: orgId,
          title: newTitle,
          kind: kindFromBody,
          source: "workbench",
          status: "active",
        };

        const { data: createdUnifiedItem, error: createUnifiedItemError } = await supabaseAdmin
          .from(unifiedItemTable)
          .insert(newUnifiedItemPayload)
          .select("id, org_id, title")
          .single();

        if (createUnifiedItemError) {
          console.error("[vault] save error: failed to create unified_item for Workbench", {
            payload: newUnifiedItemPayload,
            message: createUnifiedItemError.message,
            code: createUnifiedItemError.code,
          });
          return NextResponse.json(
            {
              ok: false,
              error: `Failed to create unified item: ${createUnifiedItemError.message}`,
              details: {
                message: createUnifiedItemError.message,
                code: createUnifiedItemError.code,
                details: createUnifiedItemError.details,
              },
            },
            { status: 500 }
          );
        }

        finalUnifiedItemId = createdUnifiedItem.id;
        finalTitle = createdUnifiedItem.title ?? newTitle;
        effectiveOrgId = orgId;
        effectiveUserId = userId;
        effectiveOwnerId = ownerId ?? userId;
      } else {
        // Unified item exists - use it
        finalUnifiedItemId = unifiedItem.id;
        finalTitle = titleFromBody ?? unifiedItem.title ?? "Untitled document";
        effectiveOrgId = unifiedItem.org_id ?? orgId;
        effectiveUserId = userId;
        // owner_id must reference auth.users(id) - use ownerId from route auth context
        effectiveOwnerId = ownerId ?? userId;
      }
    } else {
      // Builder mode: create a new unified_item row
      if (!titleFromBody) {
        return NextResponse.json(
          {
            ok: false,
            error: "Builder Save to Vault requires title",
            details: null,
          },
          { status: 400 }
        );
      }

      effectiveOrgId = orgId;
      effectiveUserId = userId;
      // owner_id must reference auth.users(id) - use ownerId from route auth context
      effectiveOwnerId = ownerId ?? userId;

      const unifiedItemPayload: any = {
        org_id: effectiveOrgId,
        title: titleFromBody,
        kind: kindFromBody,
        source: "builder",
        status: "active",
      };

      const { data: createdUnifiedItem, error: createUnifiedItemError } = await supabaseAdmin
        .from(unifiedItemTable)
        .insert(unifiedItemPayload)
        .select("id, org_id, title")
        .single();

      if (createUnifiedItemError) {
        console.error("[vault] save error: create unified_item failed", {
          payload: unifiedItemPayload,
          message: createUnifiedItemError.message,
          code: createUnifiedItemError.code,
          details: createUnifiedItemError.details,
        });
        return NextResponse.json(
          {
            ok: false,
            error: `Failed to create unified item: ${createUnifiedItemError.message}`,
            details: {
              message: createUnifiedItemError.message,
              code: createUnifiedItemError.code,
              details: createUnifiedItemError.details,
            },
          },
          { status: 500 }
        );
      }

      finalUnifiedItemId = createdUnifiedItem.id;
      finalTitle = createdUnifiedItem.title ?? titleFromBody;
    }

    // Validate effectiveOwnerId is set (should always be userId from auth session)
    if (!effectiveOwnerId) {
      console.error("[vault] save error: missing owner for document insert", { userId, orgId, ownerId });
      return NextResponse.json(
        {
          ok: false,
          error: "Missing owner for document insert",
          details: {
            code: "MISSING_OWNER",
            message: "owner_id cannot be null",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    // Create the Vault document row
    // Use the same pattern as /api/sign/documenso: owner_id = userId (from auth session, which exists in auth.users)
    // Save-to-Vault inserts into this document table with matching owner/org/status, so newly saved docs for the current user/org appear on /vault.
    const documentPayload: any = {
      org_id: effectiveOrgId,
      owner_id: effectiveOwnerId,
      title: finalTitle,
      kind: kindFromBody,
      status: "draft",
    };

    console.log("[vault] Save-to-Vault documentPayload", documentPayload);

    const { data: createdDocument, error: createDocumentError } = await supabaseAdmin
      .from(documentsTable)
      .insert(documentPayload)
      .select("id")
      .single();

    if (createDocumentError) {
      console.error("[vault] save error: create document failed", {
        payload: documentPayload,
        message: createDocumentError.message,
        code: createDocumentError.code,
        details: createDocumentError.details,
      });
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to create Vault document: ${createDocumentError.message}`,
          details: {
            message: createDocumentError.message,
            code: createDocumentError.code,
            details: createDocumentError.details,
          },
        },
        { status: 500 }
      );
    }

    // Create version if content is provided (Builder mode)
    if (contentFromBody && createdDocument?.id) {
      const versionPayload: any = {
        org_id: effectiveOrgId,
        document_id: createdDocument.id,
        number: 1,
        title: finalTitle,
        content: contentFromBody,
        created_by: effectiveUserId,
      };

      const { data: createdVersion, error: createVersionError } = await supabaseAdmin
        .from("version")
        .insert(versionPayload)
        .select("id")
        .single();

      if (createVersionError) {
        console.warn("[vault] save warning: failed to create version", {
          documentId: createdDocument.id,
          message: createVersionError.message,
          code: createVersionError.code,
        });
        // Don't fail the save if version creation fails
      } else if (createdVersion?.id) {
        // Update document with current_version_id
        await supabaseAdmin
          .from(documentsTable)
          .update({ current_version_id: createdVersion.id })
          .eq("id", createdDocument.id);
      }
    }

    // Link unified_item to document
    if (finalUnifiedItemId && createdDocument?.id) {
      const { error: linkError } = await supabaseAdmin
        .from(unifiedItemTable)
        .update({ document_id: createdDocument.id })
        .eq("id", finalUnifiedItemId);

      if (linkError) {
        console.warn("[vault] save warning: failed to link unified_item to document", {
          unifiedItemId: finalUnifiedItemId,
          documentId: createdDocument.id,
          error: linkError.message,
        });
        // Don't fail the save if linking fails
      }
    }

    // Log doc_saved_to_vault event (best-effort, don't fail on logging errors)
    try {
      const source = unifiedItemId ? "workbench" : "builder";
      const logStartedAt = performance.now();
      await logDocSavedToVault({
        orgId: effectiveOrgId,
        userId: effectiveUserId,
        unifiedItemId: finalUnifiedItemId,
        documentId: createdDocument.id,
        metadata: {
          source,
          title: finalTitle,
        },
        source,
        triggerRoute: "/api/documents/versions",
        durationMs: performance.now() - logStartedAt,
      });
    } catch (logError) {
      console.error("[vault] failed to log doc_saved_to_vault", logError);
      // Don't fail the save if logging fails
    }

    // If this is Builder mode and content was generated, also log doc_generated (for contracts) or deck_saved (for decks)
    if (!unifiedItemId && contentFromBody) {
      try {
        const logStartedAt = performance.now();
        if (kindFromBody === "deck" && metadataFromBody) {
          // Log deck-specific event (deck_saved is handled by client-side telemetry, but we can log doc_saved_to_vault here)
          // The client will log deck_saved separately
        } else {
          // Log contract doc_generated
          await logDocGenerated({
            orgId: effectiveOrgId,
            userId: effectiveUserId,
            unifiedItemId: finalUnifiedItemId,
            documentId: createdDocument.id,
            metadata: {
              source: "builder",
              templateId: templateId,
              contentLength: contentFromBody.length,
            },
            source: "builder",
            triggerRoute: "/api/documents/versions",
            durationMs: performance.now() - logStartedAt,
          });
        }
      } catch (logError) {
        console.error("[vault] failed to log doc_generated", logError);
        // Don't fail the save if logging fails
      }
    }

    const durationMs = performance.now() - startedAt;
    
    logServerEvent({
      event: "vault_save",
      userId,
      orgId: effectiveOrgId,
      docId: createdDocument.id,
      source: unifiedItemId ? "workbench" : "builder",
      route: "/api/documents/versions",
      durationMs,
      properties: {
        status: "ok",
        has_content: !!contentFromBody,
        has_template: !!templateId,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Saved to Vault",
        unifiedItemId: finalUnifiedItemId,
        documentId: createdDocument.id,
      },
      { status: 200 }
    );
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    
    console.error("[vault] save error: unhandled exception", {
      error,
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
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
      event: "vault_save",
      userId: authUserId,
      orgId: authOrgId,
      source: "vault",
      route: "/api/documents/versions",
      durationMs,
      properties: {
        status: "error",
      },
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to save to Vault: ${(error as any)?.message ?? "unknown error"}`,
        details: {
          message: (error as any)?.message ?? null,
          code: (error as any)?.code ?? null,
          details: (error as any)?.details ?? null,
        },
      },
      { status: 500 }
    );
  }
}


