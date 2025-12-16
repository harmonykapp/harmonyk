# Maestro Training Library v1 — Dev Notes

This document describes the Week 19 "Maestro Training Library + RAG plumbing" implementation as it stands now. It's intended as an internal dev reference so we don't have to reverse-engineer the flow later when we wire full RAG and job workers.

---

## 1. Data model (Supabase)

### Tables

**`mono_training_sets`**

- `id` (uuid, pk)
- `org_id` (uuid, nullable, no FK — see migration comments)
- `name` (text)
- `description` (text, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

Use: logical grouping of training docs per org (e.g. "Contracts – ACME", "Decks – Fundraise 2025").

**`mono_training_docs`**

- `id` (uuid, pk)
- `training_set_id` (uuid, references `mono_training_sets.id`)
- `vault_document_id` (uuid, nullable — no FK)
- `source_type` (enum/text; currently "vault_document" only)
- `title` (text, optional convenience cache)
- `created_at` / `updated_at`

Use: links a specific Vault document (or later: external file) into a training set.

**`mono_training_jobs`**

- `id` (uuid, pk)
- `org_id` (uuid, nullable, no FK)
- `training_doc_id` (uuid, references `mono_training_docs.id`)
- `status` (enum/text: `queued`, `processing`, `completed`, `failed`)
- `trigger` (enum/text: `manual`, `auto`)
- `error_message` (text, nullable)
- `queued_at` (timestamptz, default now())
- `started_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)

Use: audit trail of training attempts per doc. Current UI only needs "latest job per doc".

RLS is enabled but intentionally minimal; policies will be tightened in a later pass.

---

## 2. Service layer (TypeScript)

File: `@/lib/mono/training.ts`

Key types (names may be slightly simplified here; see source for exact shapes):

- `MonoTrainingJobStatus` — union of job status strings.
- `MonoTrainingJobRow` — typed view of `mono_training_jobs` rows.
- `QueueTrainingJobParams` — `{ orgId: string; vaultDocumentId: string; trigger: "manual" | "auto" }`.

Key functions:

1. `queueTrainingJobForDoc(client, params)`

   - Ensures a `mono_training_sets` row exists for the org (e.g. default "Vault" set).
   - Ensures a `mono_training_docs` row exists for the given `vaultDocumentId`.
   - Inserts a new `mono_training_jobs` row with `status = "queued"` and `trigger` from params.
   - Returns the inserted job row (or throws on Supabase error).

2. `getTrainingJobsForOrg(client, orgId)`

   - Fetches all jobs for `org_id = orgId`, optionally filtered by query params (see API).
   - Used by the API to derive per-doc training state.

3. `storeEmbeddingsForChunks(...)`

   - Currently a stub that will later:

     - Chunk the source doc.
     - Call OpenAI embeddings.
     - Persist into a dedicated embeddings table keyed to `mono_training_docs`.

RAG helpers live in `@/lib/mono/rag.ts` and are currently thin stubs. They'll be wired once embeddings exist.

---

## 3. API surface

Namespace: `app/api/mono/training/*`

1. `GET /api/mono/training/jobs`

   - Query params: `orgId` (required for now), optional `vaultDocumentId`, `status`.
   - Returns a JSON list of jobs for the org, optionally filtered down to a single doc.

2. `POST /api/mono/training/train-for-doc`

   - Body: `{ orgId: string; vaultDocumentId: string; trigger?: "manual" | "auto" }`
   - Uses `queueTrainingJobForDoc` under the hood.
   - Returns the queued job and a simple status message.

Auth / org derivation is intentionally naive for now (explicit `orgId`), to be hardened once we thread org context cleanly through Maestro and the API layer.

---

## 4. UI integration (Vault + Builder)

### Vault

File: `app/(protected)/vault/page.tsx`

- Extends the row type to include `org_id?: string | null`.
- Maintains `trainingStatusByDocId` in local state:

  - Derived from `GET /api/mono/training/jobs` for the current doc's `org_id` + `id`.
  - Maps job statuses into simple UI states like "Not trained", "Queued", "Trained", "Failed".

- Adds `onTrainWithMono` handler, which:

  - Calls `POST /api/mono/training/train-for-doc`.
  - Updates `trainingStatusByDocId` and shows basic loading / error feedback.

- Adds a "Train Maestro" action in the Actions panel for the selected document, gated behind the existing feature flag used for experimental Vault actions.

### Builder

File: `components/builder/builder-client.tsx`

- Imports `isFeatureEnabled` and uses a `monoTrainingEnabled` flag.
- Local state:

  - `trainingLoading`, `trainingQueuedForDocId`, `trainingError`.

- `handleTrainWithMono`:

  - Only available once there is a `savedDocumentId`.
  - Calls `POST /api/mono/training/train-for-doc` for that document.
  - Surfaces status and error messages inline near the actions.

- Adds a "Train Maestro" button in the Builder actions row, gated behind the same feature flag.

---

## 5. Open questions / TODO (Week 19–20)

1. **Embeddings storage**

   - Decide on a dedicated `mono_training_chunks` / `mono_embeddings` table vs reusing any existing embeddings tables.

2. **Job worker vs inline processing**

   - Current implementation only queues jobs; no background worker is running.
   - We need a simple "inline trainer" or a cron-style worker (Supabase Edge Function / external worker) to:

     - Pull the next `queued` job.
     - Fetch source content (Vault doc or external).
     - Chunk, embed, store, and mark job `completed` / `failed`.

3. **RAG integration**

   - `getRagContextForMono` currently returns stubbed data.
   - Next step is to:

     - Query embeddings for the current org + relevant training sets.
     - Surface top-K chunks as context into Maestro's system prompt / tools.

4. **Org / auth threading**

   - Replace explicit `orgId` in request bodies with server-side derivation from the authenticated user + membership tables.

This doc should be kept up to date as we fill in embeddings, workers, and RAG wiring in Week 19–20.

