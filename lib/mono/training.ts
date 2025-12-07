import type { SupabaseLikeClient } from "@/lib/activity-log";

export type MonoTrainingJobStatus = "pending" | "running" | "succeeded" | "failed";

/**
 * Minimal representation of a row in mono_training_jobs.
 * We keep this local to avoid depending on global generated DB types.
 */
export interface MonoTrainingJobRow {
  id: string;
  org_id: string;
  training_set_id: string | null;
  vault_document_id: string | null;
  status: MonoTrainingJobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueTrainingJobForDocParams {
  client: SupabaseLikeClient;
  orgId: string;
  /**
   * Vault document ID to train on.
   */
  vaultDocumentId: string;
  /**
   * Optional training set. If omitted, the server can attach a default later.
   */
  trainingSetId?: string;
}

export interface GetTrainingJobsForOrgParams {
  client: SupabaseLikeClient;
  orgId: string;
  /**
   * Maximum number of jobs to return, newest first.
   */
  limit?: number;
}

/**
 * Queue a new Mono training job for a given Vault document.
 *
 * This does not perform any heavy work itself — it only inserts a row into
 * mono_training_jobs with status = "pending". A separate worker or server-side
 * process is expected to pick up and process jobs.
 */
export async function queueTrainingJobForDoc(
  params: QueueTrainingJobForDocParams,
): Promise<MonoTrainingJobRow> {
  const { client, orgId, vaultDocumentId, trainingSetId } = params;

  const { data, error } = await client
    .from("mono_training_jobs")
    .insert({
      org_id: orgId,
      training_set_id: trainingSetId ?? null,
      vault_document_id: vaultDocumentId,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to queue Mono training job: ${error.message}`);
  }

  // We expect Supabase to return the inserted row; if it does not, something is off.
  if (!data) {
    throw new Error("Failed to queue Mono training job: insert returned no data");
  }

  return data as MonoTrainingJobRow;
}

/**
 * Fetch recent Mono training jobs for an org, newest first.
 */
export async function getTrainingJobsForOrg(
  params: GetTrainingJobsForOrgParams,
): Promise<MonoTrainingJobRow[]> {
  const { client, orgId, limit = 20 } = params;

  const { data, error } = await client
    .from("mono_training_jobs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load Mono training jobs: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data as MonoTrainingJobRow[];
}

/**
 * Input representation for a text chunk that we want to embed and eventually
 * associate with a training set + Vault document.
 *
 * This is intentionally generic — it is safe to extend later with extra metadata.
 */
export interface MonoRagChunkInput {
  id: string;
  text: string;
  /**
   * Optional arbitrary metadata to store alongside the chunk (e.g. section keys).
   */
  metadata?: Record<string, unknown>;
}

export interface StoreEmbeddingsForChunksParams {
  client: SupabaseLikeClient;
  orgId: string;
  vaultDocumentId: string;
  trainingSetId?: string;
  chunks: MonoRagChunkInput[];
}

/**
 * Store embeddings for a batch of chunks.
 *
 * NOTE: This is a deliberate no-op stub for now. We need to align this with the
 * existing embeddings storage schema (e.g. vault_embeddings or a dedicated
 * mono_embeddings table) before we start persisting vectors.
 *
 * The function is defined and typed so the rest of the pipeline can be wired
 * without blocking on the exact storage schema.
 */
export async function storeEmbeddingsForChunks(
  _params: StoreEmbeddingsForChunksParams,
): Promise<void> {
  // TODO (Week 19): Implement once embeddings storage schema is finalized.
  return Promise.resolve();
}

