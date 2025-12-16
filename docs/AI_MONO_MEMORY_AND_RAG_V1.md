# Maestro Memory + RAG Foundations (GA)

This doc describes the GA foundations for Maestro's "brain":

- **Maestro Memory v1** – user/org profiles, template usage logging, and recent conversation traces.
- **RAG foundations** – schema and helpers for embeddings that will be enabled post-GA.

The goal is to define stable interfaces that the rest of the app can call, while keeping GA behaviour simple and predictable.

---

## 1. Maestro Memory v1

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

### 1.4 Conversation traces (ActivityLog-backed)

There is no dedicated "chat history" table at GA. Instead, Maestro uses the existing `activity_log` table as a lightweight memory source:

- `logMonoQuery()` writes a `mono_query` event with:
  - `org_id`, `user_id`,
  - `type: "mono_query"`,
  - `context.message` (the user's question),
  - route + timing metadata.
- `getRecentMonoMessages()` in `lib/mono/memory.ts`:
  - Accepts `{ supabase, orgId, userId, limit }`.
  - Queries the last N `mono_query` events for the given user/org.
  - Returns an ordered array of `{ role: "user", content, createdAt }` for prompt construction.

The GA Maestro endpoint (`/api/mono`) uses this helper to:

- Pull the last few messages for continuity.
- Feed them into the OpenAI chat call as prior user turns.

### 1.3 Prompt glue

Defined in `lib/mono/prompt.ts`:

- `buildMonoPreferenceInstruction(config)` – formats org/user preferences into a clear instruction block for the model.
- `buildMonoAwareSystemPrompt(baseSystemPrompt, config)` – wraps the existing base system prompt with the Maestro preferences block.
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
- `RagStatusDisabled` and `getRagStatus()` to make the GA "RAG off" state explicit.
- `indexDocument(documentId, options, context)` – stub; will later:
  - Load document content from Vault,
  - Chunk content,
  - Embed chunks,
  - Upsert into `vault_embeddings`.
- `deleteEmbeddingsForDocument(documentId, context)` – stub; will later delete all rows for a document.
- `searchRag(query, options, context)` – stub; interface for Maestro/Builder to fetch relevant chunks.

In GA:

- `getRagStatus()` returns `{ enabled: false, reason: "RAG disabled in GA" }`.
- `indexDocument()` and `deleteEmbeddingsForDocument()` are no-ops that log in non-production.
- `searchRag()` logs calls in non-production and always returns an empty array.

This keeps call sites future-proof without accidentally implying that RAG is live.

---

## 3. Current usage and limitations

- Contracts Builder:
  - Uses Maestro Memory v1 to shape its system prompt.
  - Logs template usage after generation.
- Maestro (chat via `/api/mono`):
  - Uses preference config for tone / jurisdiction / locale.
  - Reads recent `mono_query` events via `getRecentMonoMessages()` and feeds them into the chat call.
  - Attempts a `searchRag()` call when a document id is provided, but GA behaviour is effectively "no RAG context" because RAG is disabled.
- Analyze endpoint (`/api/ai/analyze`):
  - Calls OpenAI with a JSON-only prompt and validates the response against `AnalyzeResultSchema`.
  - Logs an `analyze_completed` activity event.

Limitations (GA):

- No automatic indexing pipeline yet; `vault_embeddings` is defined but unused.
- `searchRag()` always returns an empty array; RAG is explicitly disabled at GA.
- Client flows do not yet expose UI for editing org/user profiles; defaults are applied under the hood, with an option to override via direct DB changes if needed.

Next steps (future weeks):

- Implement document indexing jobs over Vault and connector imports.
- Add UI for editing org/user preference profiles.
- Expand Maestro and Builder calls to rely on real RAG results once embeddings are populated and `getRagStatus().enabled` is true.

