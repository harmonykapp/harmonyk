# Week 19 — Maestro Memory & RAG Foundation (Dev-Only)

This document captures the current Maestro memory / RAG scaffolding as of Week 19.

Everything here is dev-only and deliberately conservative: no real embeddings, no cross-tenant mixing, no silent training.

---

## 1. What Exists Today (End of W19D5)

### 1.1. Database & Jobs

We have a minimal training jobs model wired through the /api/mono/train route:

- A job row is created per request, keyed by:
  - `org_id`
  - `vault_document_id`
  - `status` (pending initially)
  - timestamps for `created_at`, `updated_at`, `started_at`, `completed_at`

- The job is queued only — there is no background worker yet that:
  - reads the document content
  - chunks/embeds it
  - writes to any vector index

For now, this acts as a dev stub + audit trail when we hit "Train Maestro" from the UI.

---

### 1.2. API Endpoints

#### /api/mono/train (POST)

Dev-only endpoint to queue a training job.

Request body (JSON):

```jsonc
{
  "orgId": "org-uuid",
  "vaultDocumentId": "document-uuid"
}
```

Current behaviour:

- Validates `orgId` and `vaultDocumentId`
- Inserts a pending job into the training jobs table
- Returns a stub payload:

```jsonc
{
  "ok": true,
  "job": {
    "id": "job-uuid",
    "status": "pending",
    // ...other metadata
  }
}
```

There is no actual RAG training behind this yet.

---

#### /api/mono/context (POST)

Dev-only endpoint for context preview, used to simulate what a future RAG layer would return to Maestro.

Request body (JSON):

```jsonc
{
  "orgId": "org-uuid",
  "query": "optional free text",
  "maxItems": 5
}
```

Current behaviour:

- Validates `orgId`
- Ignores any real training jobs or embeddings
- Returns a static, in-memory stub with 2–3 "fake" docs that look like:

```ts
type MonoContextDoc = {
  id: string;
  title: string;
  kind?: string;
  source?: string;
  snippet?: string;
  score?: number;
  tags?: string[];
};
```

The payload shape is what future RAG backends should produce, but the contents are currently hard-coded examples (e.g. "Seed Fundraising Deck", "Standard Founder/Investor SAFE", etc.).

---

## 2. Frontend Surfaces

### 2.1. Vault — "Train Maestro" & Context Preview (Dev)

On the Vault page (when `FEATURE_VAULT_EXPERIMENTAL_ACTIONS` is enabled and a document with an `org_id` is selected):

- **Train Maestro** button:
  - Calls `/api/mono/train` with the selected document's `org_id` and `vault_document_id`
  - Shows a toast: "Maestro will train on this document in the background."
  - Logs structured info to the console via `handleApiError` when things go wrong

- **Preview Maestro context (dev)** button:
  - Calls `/api/mono/context` with:
    - `orgId` = document's `org_id`
    - `query` = document title
    - `maxItems` = 5
  - Writes the returned docs into a collapsed console group:
    - `request` (arguments)
    - `docs` (array of stub context docs)
  - Shows a toast with the number of matching docs.

All of this is behind a feature flag and only intended for internal / dev usage.

---

### 2.2. Builder — "Train Maestro" & Context Preview (Dev)

In Builder (`components/builder/builder-client.tsx`), for Contracts:

- Once a document is saved to Vault, we:
  - Track `savedDocumentId`
  - Enable two dev-only actions when `FEATURE_VAULT_EXPERIMENTAL_ACTIONS` is on:

1. **Preview Maestro context (dev)**

   - Looks up `org_id` + `title` for `savedDocumentId` from Supabase (`document` table)
   - Derives an effective query:
     - `documentTitle` input, or
     - DB `title`, or
     - Template name, or `"Untitled document"`
   - Calls `/api/mono/context` with `{ orgId, query, maxItems: 5 }`
   - Logs request + docs in a collapsed console group:
     - `[builder-mono-context] Preview Maestro context (dev)`
   - Shows a toast:
     - `Found N matching internal docs…` or
     - `No internal docs matched this query yet.`

2. **Train Maestro**

   - Uses the same `savedDocumentId` to find `org_id`
   - Calls `/api/mono/train` to queue a job
   - On success:
     - Stores `trainingQueuedForDocId`
     - Shows a small banner: "Maestro training job queued for this document."
   - On error:
     - Uses `handleApiError` with context `"builder-mono-train"`
     - Surfaces a toast + optional inline error message.

Again, both buttons are gated by the experimental feature flag and require a saved Vault document.

---

## 3. What This Is Not (Yet)

Important constraints / non-features at this stage:

- No embeddings, vector store, or real retrieval
- No background worker that reads from `training_jobs`
- No cross-document or cross-tenant learning
- No automatic / silent training jobs
- No Maestro chat integration yet (Workbench still uses existing stub flows)

This is scaffolding, not a full Maestro memory system.

---

## 4. Dev Workflow & How to Use It

### 4.1. Enabling the Features

- Ensure the feature flag `FEATURE_VAULT_EXPERIMENTAL_ACTIONS` is `true` for your environment.

  This currently controls:
  - Vault: "Train Maestro" + "Preview Maestro context (dev)"
  - Builder: "Preview Maestro context (dev)" + "Train Maestro"

### 4.2. Typical Dev Flow

1. Create a contract in Builder
   - Pick a template
   - Generate V1 content
   - Save to Vault

2. **Train Maestro** on it (stub)
   - In Builder or Vault, click "Train Maestro"
   - Confirm:
     - A training job row is created in DB
     - No errors in the console

3. **Preview Maestro context (dev)**
   - In Vault or Builder, click "Preview Maestro context (dev)"
   - Check the browser console:
     - Collapsed group with `request` + stub `docs` array
   - Verify the toast message reflects the number of docs.

This gives us a full end-to-end dev path:

> Vault/Builder → `/api/mono/train` → `training_jobs` row
> Vault/Builder → `/api/mono/context` → stub context docs → console/toast

---

## 5. Guardrails & Data Policy

These dev features respect the current North Star data/training principles:

- No user documents are used for any global training library.
- All "Maestro training" right now is a no-op stub + job logging.
- When we wire real RAG:
  - It will be per-organisation, not cross-tenant.
  - It will be opt-in and transparent, with clear UX and audit trails.
- Until there is a proper RAG backend and ToS / DP update, no real customer data should be pointed at any external training service.

---

## 6. Next Steps (Week 19–20 and Beyond)

Planned follow-ups, roughly in this order:

1. **Worker / Cron stub** (internal only)
   - Read pending jobs from the training jobs table
   - Mark as completed after a fake delay
   - No real embeddings yet — just verifies job lifecycle

2. **Real RAG backend adapter** (internal only)
   - Add a `lib/mono-rag-adapter.ts` that:
     - Is the only place allowed to talk to a vector store / external RAG service
     - Respects strict `org_id` scoping and data controls

3. **Maestro chat integration** (Workbench)
   - Let Maestro pull from:
     - Vault docs (RAG)
     - Builder outputs
     - Accounts/Decks packs (read-only)
   - Still human-in-the-loop; no auto-sends.

4. **Admin/Dev tooling**
   - Simple internal view of:
     - Training job queue
     - Context hits per org
     - Error rates / telemetry

5. **Production hardening**
   - Rate limits, auth checks, and observability around all Maestro endpoints
   - Feature flags for:
     - `FEATURE_MONO_RAG_INTERNAL`
     - `FEATURE_MONO_RAG_BETA`

---

## 7. TL;DR

- Week 19 gives us a safe, end-to-end Maestro training + context preview path that is:
  - Fully feature-flagged
  - Dev-only
  - Non-destructive (no real training yet)

- Vault and Builder both:
  - Can queue a stub training job for a Vault doc
  - Can preview a stub RAG context payload for an org

- This sets the stage for Week 20+ to swap in a real RAG backend without changing the UI contracts or breaking GA scope.

