# Mono Memory + RAG Foundations (Week 9)

This doc describes the Week 9 foundations for Mono's "brain":

- **Mono Memory v1** – user/org profiles and template usage logging.
- **RAG foundations** – embeddings table and helpers that will later let Mono and Builder pull in grounded context from Vault and connectors.

It is intentionally implementation-light. The goal is to define stable interfaces that the rest of the app can call.

---

## 1. Mono Memory v1

### 1.1 Data model

Backed by the Week 9 migration `202511260900_mono_memory_v1.sql`:

- `mono_tone` enum – e.g. `neutral`, `friendly`, `formal`.
- `mono_risk_profile` enum – `conservative`, `balanced`, `aggressive`.
- `mono_org_profile` – per-organisation defaults:
  - `tone`, `risk_profile`, `jurisdiction`, `locale`.
- `mono_user_profile` – per-user overrides, same shape as org.
- `mono_template_usage` – logs usage of templates/clauses:
  - `user_id`, `org_id`, `builder_type`, `template_key`, `clause_key`, `source`.

We assume:

- Org profile is the baseline for a workspace.
- User profile can override org defaults when needed.

### 1.2 Types and helpers

Defined in `lib/mono/types.ts` and `lib/mono/memory.ts`:

- `MonoTone`, `MonoRiskProfile`, `MonoBuilderType`.
- `MonoOrgProfile`, `MonoUserProfile`, `MonoTemplateUsage`, `MonoProfiles`.
- `DEFAULT_MONO_TONE`, `DEFAULT_MONO_RISK_PROFILE`, `DEFAULT_MONO_JURISDICTION`, `DEFAULT_MONO_LOCALE`.

Helpers:

- `getMonoProfiles()` – resolves org + user profiles into a `MonoProfiles` object, falling back to defaults when DB rows are missing.
- `buildMonoPreferenceConfig()` – turns `MonoProfiles` into a small, serialisable config used at call sites:
  - `{ tone, riskProfile, jurisdiction, locale }`.
- `recordTemplateUsage()` – fire-and-forget logging for template and clause usage. It is non-blocking by design; failures are caught and logged only in development.

### 1.3 Prompt glue

Defined in `lib/mono/prompt.ts`:

- `buildMonoPreferenceInstruction(config)` – formats org/user preferences into a clear instruction block for the model.
- `buildMonoAwareSystemPrompt(baseSystemPrompt, config)` – wraps the existing base system prompt with the Mono preferences block.
- `formatMonoPreferenceConfigForDebug(config)` – small helper to log applied preferences in development.

Contracts Builder now:

- Calls `getMonoProfiles()` + `buildMonoPreferenceConfig()`.
- Wraps its base system prompt via `buildMonoAwareSystemPrompt()`.
- Logs the applied preference config in dev for visibility.

Template usage:

- After a successful contract generation, `recordTemplateUsage()` is called with:
  - `userId`, `orgId` (if available),
  - `builderType: "contract"`,
  - `templateKey` derived from the existing builder payload,
  - `clauseKey: null` for now,
  - `source: "ai"`.

---

## 2. RAG Foundations

### 2.1 Storage

Backed by `202511270900_rag_foundations_v1.sql`:

- Extension: `vector` (pgvector) enabled on `public`.
- Table: `public.vault_embeddings`:
  - `id uuid primary key`,
  - `document_id uuid not null`,
  - `chunk_id text not null`,
  - `content text not null`,
  - `embedding vector(1536) not null`,
  - `metadata jsonb default '{}'`,
  - `created_at timestamptz default now()`.
- Optional FK to `public.vault_documents(id)` when that table exists.
- Indexes:
  - `idx_vault_embeddings_document` on `document_id`,
  - `idx_vault_embeddings_embedding_ivfflat` for cosine similarity.

### 2.2 Types and helpers

Defined in `lib/rag/types.ts` and `lib/rag/index.ts`:

- `RagChunk`, `RagQueryOptions`, `RagResult`, `RagIndexOptions`, `RagBackend`, `RagSearchContext`.
- `indexDocument(documentId, options, context)` – stub; will later:
  - Load document content from Vault,
  - Chunk content,
  - Embed chunks,
  - Upsert into `vault_embeddings`.
- `deleteEmbeddingsForDocument(documentId, context)` – stub; will later delete all rows for a document.
- `searchRag(query, options, context)` – stub; interface for Mono/Builder to fetch relevant chunks.

In Week 9 these helpers only log debug information in non-production. They are safe to call but return empty results until we implement real indexing/search.

---

## 3. Current usage and limitations

- Contracts Builder:
  - Uses Mono Memory v1 to shape its system prompt.
  - Logs template usage after generation.
- Mono (analyze/explain):
  - When a document id is provided by the client, attempts a `searchRag()` call scoped to that document and, if results exist, appends a "RAG CONTEXT" block to the system prompt.

Limitations (Week 9):

- No automatic indexing pipeline yet; `vault_embeddings` stays empty until we implement it.
- `searchRag()` always returns an empty array; behaviour is future-compatible but not yet grounded.
- Client flows do not yet expose UI for editing org/user profiles; defaults are applied under the hood.

Next steps (future weeks):

- Implement document indexing jobs over Vault and connector imports.
- Add UI for editing org/user preference profiles.
- Expand Mono and Builder calls to rely on real RAG results once embeddings are populated.

