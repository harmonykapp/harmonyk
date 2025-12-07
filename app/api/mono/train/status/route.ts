import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getTrainingJobsForOrg, type MonoTrainingJobRow } from "@/lib/mono/training";

function badRequest(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 400 },
  );
}

function serverError(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 500 },
  );
}

/**
 * GET /api/mono/train/status
 *
 * List recent Mono training jobs for an org.
 *
 * Query parameters:
 * - orgId (required): org to scope jobs to.
 * - limit (optional): max number of jobs (default 20, max 100).
 * - vaultDocumentId (optional): if provided, filter jobs to a single Vault doc.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const limitParam = searchParams.get("limit");
  const vaultDocumentId = searchParams.get("vaultDocumentId");

  if (!orgId) {
    return badRequest("orgId query parameter is required");
  }

  const limit =
    limitParam && Number.isFinite(Number(limitParam)) ? Math.min(Number(limitParam), 100) : 20;

  const supabase = createServerSupabaseClient();

  try {
    let jobs = await getTrainingJobsForOrg({
      client: supabase,
      orgId,
      limit,
    });

    if (vaultDocumentId) {
      jobs = jobs.filter((job) => job.vault_document_id === vaultDocumentId);
    }

    return NextResponse.json<{ jobs: MonoTrainingJobRow[] }>({
      jobs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error loading training jobs";
    return serverError(message);
  }
}

