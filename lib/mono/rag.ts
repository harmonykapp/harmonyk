import type { SupabaseLikeClient } from "@/lib/activity-log";

export interface MonoRagChunk {
  id: string;
  text: string;
  source: "vault" | "other";
  /**
   * Optional link back to the Vault document this chunk came from.
   */
  vaultDocumentId?: string;
}

export interface MonoRagContext {
  chunks: MonoRagChunk[];
  /**
   * Rough size accounting to keep prompts under control.
   * For now this is character-based; we can move to token estimates later.
   */
  totalCharacters: number;
}

export interface GetRagContextForMonoParams {
  client: SupabaseLikeClient;
  orgId: string;
  /**
   * Natural-language query from the user. Not currently used in the stub
   * implementation but included so we can plug it into embeddings later.
   */
  query: string;
  /**
   * Soft budget for how much context we are allowed to include. This should be
   * interpreted in "token-like" units (roughly 3–4 characters per token), but
   * the exact accounting can be refined later.
   */
  tokensBudget: number;
  /**
   * Optional: restrict context to a single Vault document.
   */
  documentId?: string;
}

/**
 * Compute a RAG context for Maestro.
 *
 * This is a conservative stub implementation:
 * - It validates the budget.
 * - It returns an empty context for now.
 *
 * In later Week 19 steps, we will:
 * - Load relevant Vault text.
 * - Chunk it into segments.
 * - Use the embeddings API to pick the best chunks for the given query.
 * - Persist embeddings via storeEmbeddingsForChunks.
 */
export async function getRagContextForMono(
  params: GetRagContextForMonoParams,
): Promise<MonoRagContext> {
  const { tokensBudget } = params;

  if (!Number.isFinite(tokensBudget) || tokensBudget <= 0) {
    return {
      chunks: [],
      totalCharacters: 0,
    };
  }

  // We currently do not read from Supabase or call embeddings here.
  // The function exists so we can:
  // - Wire it into the /api/mono route behind feature flags.
  // - Incrementally add Vault + embeddings logic without changing the call sites.
  const _client: SupabaseLikeClient | null = null;
  void _client;

  return {
    chunks: [],
    totalCharacters: 0,
  };
}

/**
 * Small helper to estimate "token-like" units from a string.
 * This is intentionally rough and does not depend on any external tokenizer.
 */
export function estimateTokenBudgetForText(text: string): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

