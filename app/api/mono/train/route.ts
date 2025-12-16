import { NextResponse, type NextRequest } from "next/server";

import {
    getTrainingJobsForOrg,
    queueTrainingJobForDoc,
    type MonoTrainingJobRow,
} from "@/lib/mono/training";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface PostBody {
  orgId?: string;
  vaultDocumentId?: string;
  trainingSetId?: string;
}

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
 * POST /api/mono/train
 *
 * Queue a new Maestro training job for a Vault document.
 *
 * NOTE:
 * - For now we accept orgId in the request body. Once this is wired into the
 *   authenticated app shell, we can derive orgId from the session/org context
 *   helper instead of trusting the client.
 */
export async function POST(req: NextRequest) {
  let body: PostBody;

  try {
    body = (await req.json()) as PostBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { orgId, vaultDocumentId, trainingSetId } = body;

  if (!orgId || typeof orgId !== "string") {
    return badRequest("orgId is required");
  }

  if (!vaultDocumentId || typeof vaultDocumentId !== "string") {
    return badRequest("vaultDocumentId is required");
  }

  const supabase = createServerSupabaseClient();

  try {
    const job = await queueTrainingJobForDoc({
      client: supabase,
      orgId,
      vaultDocumentId,
      trainingSetId,
    });

    return NextResponse.json<{ job: MonoTrainingJobRow }>({
      job,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error queuing training job";
    return serverError(message);
  }
}

/**
 * GET /api/mono/train
 *
 * Convenience handler: list recent jobs for an org.
 * This mirrors /api/mono/train/status but keeps the surface simple if we only
 * care about "what's the latest training activity?" in the UI.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const limitParam = searchParams.get("limit");

  if (!orgId) {
    return badRequest("orgId query parameter is required");
  }

  const limit =
    limitParam && Number.isFinite(Number(limitParam)) ? Math.min(Number(limitParam), 100) : 20;

  const supabase = createServerSupabaseClient();

  try {
    const jobs = await getTrainingJobsForOrg({ client: supabase, orgId, limit });
    return NextResponse.json<{ jobs: MonoTrainingJobRow[] }>({ jobs });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error loading training jobs";
    return serverError(message);
  }
}

