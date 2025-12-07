-- Mono RAG training library schema
-- Week 19 (post-GA / experimental)
-- Tables:
--   mono_training_sets   - per-org training sets
--   mono_training_docs   - link Vault docs to training sets
--   mono_training_jobs   - track training job lifecycle

-- Enum for training job status
create type public.mono_training_job_status as enum (
  'pending',
  'running',
  'succeeded',
  'failed'
);

-- Per-org training sets / buckets
create table public.mono_training_sets (
  id uuid primary key default gen_random_uuid(),
  -- NOTE: We intentionally do not enforce a foreign key here because the main
  -- org table name differs between environments. org_id is still scoped and
  -- protected via RLS using the member/org membership model.
  org_id uuid not null,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index mono_training_sets_org_id_idx
  on public.mono_training_sets (org_id);

-- Link Vault documents to training sets
create table public.mono_training_docs (
  id uuid primary key default gen_random_uuid(),
  -- NOTE: We intentionally do not enforce a foreign key here because the main
  -- org table name differs between environments. org_id is still scoped and
  -- protected via RLS using the member/org membership model, consistent with
  -- mono_training_sets.
  org_id uuid not null,
  training_set_id uuid not null references public.mono_training_sets(id) on delete cascade,
  -- We intentionally do not enforce a foreign key to the Vault documents table
  -- here because its name/shape can differ between environments. We only need
  -- a stable UUID reference; higher layers and RLS enforce correctness.
  vault_document_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint mono_training_docs_unique_doc_per_set
    unique (org_id, training_set_id, vault_document_id)
);

create index mono_training_docs_org_id_idx
  on public.mono_training_docs (org_id);

create index mono_training_docs_training_set_id_idx
  on public.mono_training_docs (training_set_id);

create index mono_training_docs_vault_document_id_idx
  on public.mono_training_docs (vault_document_id);

-- Training job lifecycle (queue + status)
create table public.mono_training_jobs (
  id uuid primary key default gen_random_uuid(),
  -- NOTE: We intentionally do not enforce a foreign key here because the main
  -- org table name differs between environments. org_id is still scoped and
  -- protected via RLS using the member/org membership model, consistent with
  -- mono_training_sets and mono_training_docs.
  org_id uuid not null,
  training_set_id uuid references public.mono_training_sets(id) on delete set null,
  -- As with mono_training_docs, we avoid a hard FK to the Vault documents
  -- table and simply store the document UUID. This keeps the migration
  -- portable while still letting the app join on vault documents when needed.
  vault_document_id uuid,
  status public.mono_training_job_status not null default 'pending',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index mono_training_jobs_org_id_idx
  on public.mono_training_jobs (org_id);

create index mono_training_jobs_status_idx
  on public.mono_training_jobs (status);

create index mono_training_jobs_training_set_id_idx
  on public.mono_training_jobs (training_set_id);

create index mono_training_jobs_vault_document_id_idx
  on public.mono_training_jobs (vault_document_id);

-- Enable RLS for strict per-org isolation
-- Policies will be added in a later migration once we plug into
-- the existing auth/org-context helpers.
alter table public.mono_training_sets
  enable row level security;

alter table public.mono_training_docs
  enable row level security;

alter table public.mono_training_jobs
  enable row level security;

