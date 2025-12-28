-- Harmonyk → DocSafe future-proof schema (v2025-12-22, Drive + Sentinel aligned)
-- Goal: Add DocSafe-ready fields + create a clean integration/outbox layer WITHOUT breaking current Harmonyk flows.
-- Safe to run multiple times (uses IF NOT EXISTS + conditional ALTER when tables exist).

-- ============================================================================
-- 1) Enums (namespaced as docsafe_*)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'docsafe_storage_backend') THEN
    CREATE TYPE public.docsafe_storage_backend AS ENUM (
      'harmonyk_standard',  -- current default (e.g., Google Drive / standard vault)
      'gdrive',
      'docsafe_drive',      -- DocSafe Drive (secure, sharded storage)
      'external'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'docsafe_proof_status') THEN
    CREATE TYPE public.docsafe_proof_status AS ENUM (
      'none',
      'pending',
      'anchored',
      'failed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'docsafe_share_backend') THEN
    CREATE TYPE public.docsafe_share_backend AS ENUM (
      'harmonyk',
      'docsafe'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'docsafe_actor_type') THEN
    CREATE TYPE public.docsafe_actor_type AS ENUM (
      'user',
      'guest',
      'service'
    );
  END IF;
END $$;

-- ============================================================================
-- 2) DocSafe integration tables (Harmonyk can start writing here immediately)
-- ============================================================================

-- 2.1 Object link table
-- Maps Harmonyk documents to DocSafe object IDs (created later).
CREATE TABLE IF NOT EXISTS public.docsafe_object_links (
  harmonyk_document_id uuid PRIMARY KEY,
  docsafe_object_id text,
  storage_backend public.docsafe_storage_backend NOT NULL DEFAULT 'harmonyk_standard',

  -- Optional fields for later (do not enforce FKs yet to avoid coupling).
  org_id uuid,

  -- Metadata helpful for reconciliation
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docsafe_object_links_backend
  ON public.docsafe_object_links (storage_backend);
CREATE INDEX IF NOT EXISTS idx_docsafe_object_links_object_id
  ON public.docsafe_object_links (docsafe_object_id);

-- 2.2 Version link table
-- Maps Harmonyk document versions to DocSafe version IDs + proof receipt refs.
CREATE TABLE IF NOT EXISTS public.docsafe_version_links (
  harmonyk_version_id uuid PRIMARY KEY,
  harmonyk_document_id uuid,

  docsafe_object_id text,
  docsafe_version_id text,

  -- Deterministic integrity fields (Harmonyk can compute now, DocSafe can verify later)
  content_hash_sha256 text,
  canonicalization_version text,
  byte_size bigint,

  -- Proof / anchoring
  proof_status public.docsafe_proof_status NOT NULL DEFAULT 'none',
  proof_request_id text,
  proof_receipt_id text,
  proof_root_id text,
  anchored_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docsafe_version_links_doc
  ON public.docsafe_version_links (harmonyk_document_id);
CREATE INDEX IF NOT EXISTS idx_docsafe_version_links_hash
  ON public.docsafe_version_links (content_hash_sha256);
CREATE INDEX IF NOT EXISTS idx_docsafe_version_links_status
  ON public.docsafe_version_links (proof_status);
CREATE INDEX IF NOT EXISTS idx_docsafe_version_links_docsafe_ids
  ON public.docsafe_version_links (docsafe_object_id, docsafe_version_id);

-- 2.3 Share link table
-- Allows Harmonyk to flip from "native sharing" to "DocSafe sharing" without schema churn.
CREATE TABLE IF NOT EXISTS public.docsafe_share_links (
  harmonyk_share_id uuid PRIMARY KEY,
  harmonyk_document_id uuid,
  harmonyk_version_id uuid,

  share_backend public.docsafe_share_backend NOT NULL DEFAULT 'harmonyk',
  docsafe_share_id text,
  share_url text,

  -- Future policy surface (kept JSON for flexibility; DocSafe can enforce later)
  share_policy jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Engagement counters (optional; can be populated via webhooks later)
  view_count bigint NOT NULL DEFAULT 0,
  download_count bigint NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docsafe_share_links_backend
  ON public.docsafe_share_links (share_backend);
CREATE INDEX IF NOT EXISTS idx_docsafe_share_links_docsafe_share_id
  ON public.docsafe_share_links (docsafe_share_id);
CREATE INDEX IF NOT EXISTS idx_docsafe_share_links_doc
  ON public.docsafe_share_links (harmonyk_document_id);

-- 2.4 Outbox for generic DocSafe event ingestion
-- Harmonyk writes normalized events here; later a worker pushes to DocSafe /v1/events:ingest.
CREATE TABLE IF NOT EXISTS public.docsafe_event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Idempotency and tracing
  idempotency_key text NOT NULL,
  event_type text NOT NULL, -- e.g. "share.created", "signature.signer_signed", etc.
  schema_version text NOT NULL DEFAULT 'v1',

  -- Actor and tenancy
  actor_type public.docsafe_actor_type NOT NULL DEFAULT 'user',
  actor_id uuid,
  org_id uuid,

  -- Targets (keep UUIDs to match Harmonyk internal IDs)
  harmonyk_document_id uuid,
  harmonyk_version_id uuid,
  harmonyk_share_id uuid,
  envelope_id uuid, -- signature/workflow envelope if you use one (optional)

  -- Optional network context (store now; later you can hash/redact before anchoring)
  ip text,
  user_agent text,

  occurred_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Delivery lifecycle (Harmonyk → DocSafe)
  status text NOT NULL DEFAULT 'queued', -- queued|sending|sent|failed
  attempt_count int NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  sent_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_docsafe_event_outbox_idempotency
  ON public.docsafe_event_outbox (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_docsafe_event_outbox_status_next
  ON public.docsafe_event_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_docsafe_event_outbox_doc
  ON public.docsafe_event_outbox (harmonyk_document_id, harmonyk_version_id);
CREATE INDEX IF NOT EXISTS idx_docsafe_event_outbox_type_time
  ON public.docsafe_event_outbox (event_type, occurred_at);

-- ============================================================================
-- 3) Optional: add DocSafe-ready columns onto existing Harmonyk tables (if they exist)
--    This avoids breaking code while future-proofing the canonical schema.
-- ============================================================================

DO $$
BEGIN
  -- documents
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE public.documents
        ADD COLUMN IF NOT EXISTS storage_backend public.docsafe_storage_backend NOT NULL DEFAULT 'harmonyk_standard',
        ADD COLUMN IF NOT EXISTS external_object_id text,
        ADD COLUMN IF NOT EXISTS classification text,
        ADD COLUMN IF NOT EXISTS retention_policy_id uuid,
        ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false
    $sql$;

    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_documents_storage_backend
        ON public.documents (storage_backend)
    $sql$;
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_documents_external_object_id
        ON public.documents (external_object_id)
    $sql$;
  END IF;

  -- document_versions (common names: document_versions OR versions)
  IF to_regclass('public.document_versions') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE public.document_versions
        ADD COLUMN IF NOT EXISTS content_hash_sha256 text,
        ADD COLUMN IF NOT EXISTS canonicalization_version text,
        ADD COLUMN IF NOT EXISTS byte_size bigint,
        ADD COLUMN IF NOT EXISTS proof_status public.docsafe_proof_status NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS proof_receipt_id text,
        ADD COLUMN IF NOT EXISTS proof_root_id text
    $sql$;

    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_document_versions_hash
        ON public.document_versions (content_hash_sha256)
    $sql$;
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_document_versions_proof_status
        ON public.document_versions (proof_status)
    $sql$;
  ELSIF to_regclass('public.versions') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE public.versions
        ADD COLUMN IF NOT EXISTS content_hash_sha256 text,
        ADD COLUMN IF NOT EXISTS canonicalization_version text,
        ADD COLUMN IF NOT EXISTS byte_size bigint,
        ADD COLUMN IF NOT EXISTS proof_status public.docsafe_proof_status NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS proof_receipt_id text,
        ADD COLUMN IF NOT EXISTS proof_root_id text
    $sql$;

    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_versions_hash
        ON public.versions (content_hash_sha256)
    $sql$;
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_versions_proof_status
        ON public.versions (proof_status)
    $sql$;
  END IF;

  -- shares
  IF to_regclass('public.shares') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE public.shares
        ADD COLUMN IF NOT EXISTS share_backend public.docsafe_share_backend NOT NULL DEFAULT 'harmonyk',
        ADD COLUMN IF NOT EXISTS external_share_id text,
        ADD COLUMN IF NOT EXISTS share_policy jsonb NOT NULL DEFAULT '{}'::jsonb
    $sql$;

    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_shares_share_backend
        ON public.shares (share_backend)
    $sql$;
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_shares_external_share_id
        ON public.shares (external_share_id)
    $sql$;
  END IF;

  -- activity log (common names: activity_log OR activity_logs)
  IF to_regclass('public.activity_log') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE public.activity_log
        ADD COLUMN IF NOT EXISTS event_type text,
        ADD COLUMN IF NOT EXISTS actor_type public.docsafe_actor_type,
        ADD COLUMN IF NOT EXISTS idempotency_key text,
        ADD COLUMN IF NOT EXISTS schema_version text
    $sql$;
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_activity_log_event_type
        ON public.activity_log (event_type)
    $sql$;
  ELSIF to_regclass('public.activity_logs') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE public.activity_logs
        ADD COLUMN IF NOT EXISTS event_type text,
        ADD COLUMN IF NOT EXISTS actor_type public.docsafe_actor_type,
        ADD COLUMN IF NOT EXISTS idempotency_key text,
        ADD COLUMN IF NOT EXISTS schema_version text
    $sql$;
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type
        ON public.activity_logs (event_type)
    $sql$;
  END IF;
END $$;

-- ============================================================================
-- 4) Trigger to auto-update updated_at in new DocSafe tables (lightweight, safe)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.docsafe_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.docsafe_object_links') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'tr_docsafe_object_links_updated_at'
    ) THEN
      CREATE TRIGGER tr_docsafe_object_links_updated_at
      BEFORE UPDATE ON public.docsafe_object_links
      FOR EACH ROW EXECUTE FUNCTION public.docsafe_set_updated_at();
    END IF;
  END IF;

  IF to_regclass('public.docsafe_version_links') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'tr_docsafe_version_links_updated_at'
    ) THEN
      CREATE TRIGGER tr_docsafe_version_links_updated_at
      BEFORE UPDATE ON public.docsafe_version_links
      FOR EACH ROW EXECUTE FUNCTION public.docsafe_set_updated_at();
    END IF;
  END IF;

  IF to_regclass('public.docsafe_share_links') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'tr_docsafe_share_links_updated_at'
    ) THEN
      CREATE TRIGGER tr_docsafe_share_links_updated_at
      BEFORE UPDATE ON public.docsafe_share_links
      FOR EACH ROW EXECUTE FUNCTION public.docsafe_set_updated_at();
    END IF;
  END IF;

  IF to_regclass('public.docsafe_event_outbox') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'tr_docsafe_event_outbox_updated_at'
    ) THEN
      CREATE TRIGGER tr_docsafe_event_outbox_updated_at
      BEFORE UPDATE ON public.docsafe_event_outbox
      FOR EACH ROW EXECUTE FUNCTION public.docsafe_set_updated_at();
    END IF;
  END IF;
END $$;

-- NOTE: RLS policies are intentionally NOT added yet.
-- When DocSafe integration goes live, add RLS based on your org/workspace membership model.

