// Deck Export API (v1)
// GET /api/decks/[docId]/export
//
// Returns HTML export of a deck document for printing/saving as PDF.
// This is a minimal v1 implementation; formatting will be improved later with real slide layout.
//
// Authentication: Uses route auth to verify user has access to the document.

import { NextRequest, NextResponse } from "next/server";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { renderContent } from "@/lib/render";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const resolvedParams = await params;
    const docId = resolvedParams?.docId;

    if (!docId) {
      return new NextResponse("Missing document ID", { status: 400 });
    }

    // Authenticate user
    const { isAuthenticated, userId, supabase: supabaseAdmin } = await getRouteAuthContext(req);

    if (!isAuthenticated || !userId) {
      return new NextResponse("Authentication required", { status: 401 });
    }

    // Load document and verify it's a deck
    const { data: doc, error: docError } = await supabaseAdmin
      .from("document")
      .select("id, title, kind, owner_id, org_id")
      .eq("id", docId)
      .single();

    if (docError || !doc) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Verify user owns the document or has org access
    // Note: For now, we only check owner_id. Org-level access can be added later.
    if (doc.owner_id !== userId) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Verify it's a deck
    if (doc.kind !== "deck") {
      return new NextResponse("Document is not a deck", { status: 400 });
    }

    // Load latest version
    const { data: version, error: versionError } = await supabaseAdmin
      .from("version")
      .select("content")
      .eq("document_id", docId)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionError || !version?.content) {
      return new NextResponse("Version not found", { status: 404 });
    }

    // Parse metadata from content if present (strip it for display)
    let contentForExport = version.content;
    const metadataMatch = contentForExport.match(/<!-- MONO_DECK_METADATA:({.*?}) -->\s*\n*/s);
    if (metadataMatch) {
      // Remove metadata comment from export
      contentForExport = contentForExport.replace(metadataMatch[0], "");
    }

    // Render markdown to HTML using existing render helper
    const { html: renderedHtml } = renderContent(contentForExport.trim(), "md");

    // Build full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title || "Deck Export"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1 {
      font-size: 2rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid #ddd;
      padding-bottom: 0.5rem;
    }
    h2 {
      font-size: 1.5rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: #555;
    }
    h3 {
      font-size: 1.25rem;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }
    p {
      margin: 1rem 0;
    }
    ul, ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
    @media print {
      body {
        padding: 1rem;
      }
      h1 {
        page-break-after: avoid;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${doc.title || "Deck Export"}</h1>
  ${renderedHtml}
</body>
</html>`;

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[deck-export] Error", error);
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    return new NextResponse(`Export failed: ${errorMessage}`, { status: 500 });
  }
}

