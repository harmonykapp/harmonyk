// RAG foundations for GA.
//
// Public interface is stable but RAG is disabled at GA. These helpers are
// safe no-ops that log when called. Post-GA we will wire them to pgvector-
// backed embeddings in Supabase.

import type {
  RagIndexOptions,
  RagQueryOptions,
  RagResult,
  RagSearchContext,
} from "./types";

const DEFAULT_RAG_BACKEND: RagSearchContext = {
  backend: "pgvector",
};

export interface RagStatusDisabled {
  enabled: false;
  reason: "RAG disabled in GA";
}

export function getRagStatus(): RagStatusDisabled {
  return {
    enabled: false,
    reason: "RAG disabled in GA",
  };
}

/**
 * indexDocument
 *
 * High-level entry point to (re)index a document into vault_embeddings.
 * In GA this is a no-op because RAG is disabled. It remains safe to call.
 */
export async function indexDocument(
  documentId: string,
  options: RagIndexOptions = {},
  context: RagSearchContext = DEFAULT_RAG_BACKEND,
): Promise<void> {
  if (!documentId) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[rag] indexDocument called (RAG disabled in GA)", {
      documentId,
      options,
      context,
    });
  }
}

/**
 * deleteEmbeddingsForDocument
 *
 * Convenience helper to wipe embeddings for a given document_id.
 * In GA this is a no-op because RAG is disabled.
 */
export async function deleteEmbeddingsForDocument(
  documentId: string,
  context: RagSearchContext = DEFAULT_RAG_BACKEND,
): Promise<void> {
  if (!documentId) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[rag] deleteEmbeddingsForDocument called (RAG disabled in GA)", {
      documentId,
      context,
    });
  }
}

/**
 * searchRag
 *
 * Primary entry for Mono / Builder when they want to pull in relevant chunks
 * for a user query.
 *
 * In GA this returns an empty array and logs calls in non-production. Callers
 * should treat an empty result set as "no RAG context available".
 */
export async function searchRag(
  query: string,
  options: RagQueryOptions = {},
  context: RagSearchContext = DEFAULT_RAG_BACKEND,
): Promise<RagResult[]> {
  if (!query.trim()) {
    return [];
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[rag] searchRag called (RAG disabled in GA)", {
      query,
      options,
      context,
    });
  }

  return [];
}

