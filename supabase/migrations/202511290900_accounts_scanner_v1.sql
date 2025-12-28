-- Week 14 — Accounts Builder v1
-- Accounts scanner data model: financial_documents + accounts_expenses (+ enums)

-- Enum: type of financial document detected from connectors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'financial_doc_type'
  ) THEN
    CREATE TYPE public.financial_doc_type AS ENUM (
      'receipt',
      'invoice',
      'bank_statement',
      'pl_export',
      'tax_notice',
      'other'
    );
  END IF;
END $$;

-- Enum: supported accounts report types (for metadata / future use)
-- (None added yet; reserved for future extension.)

-- ---------------------------------------------------------------------------
-- financial_documents
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Only create financial_documents if organizations table exists.
  IF to_regclass('public.organizations') IS NOT NULL THEN

    CREATE TABLE IF NOT EXISTS public.financial_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Tenant scoping
      org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,

      -- Where this document came from
      -- For GA we only support Google connectors
      source_connector text NOT NULL CHECK (source_connector IN ('gmail', 'drive')),
      external_id text NOT NULL,

      -- Optional link to a Vault document if/when it is vaulted
      vault_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,

      -- Classification
      financial_doc_type public.financial_doc_type NOT NULL DEFAULT 'other',
      vendor text,
      doc_date date,
      currency text,
      amount_total numeric,
      confidence_score numeric,

      -- Raw connector metadata / AI classification context
      raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

      -- Timestamps
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

      -- Avoid duplicate rows per org + connector item
      UNIQUE (org_id, source_connector, external_id)
    );

  END IF;
END $$;

-- Indexes to support common inbox queries
DO $$
BEGIN
  IF to_regclass('public.financial_documents') IS NOT NULL THEN

    CREATE INDEX IF NOT EXISTS financial_documents_org_date_idx
      ON public.financial_documents (org_id, doc_date DESC NULLS LAST);

    CREATE INDEX IF NOT EXISTS financial_documents_org_type_confidence_idx
      ON public.financial_documents (org_id, financial_doc_type, confidence_score);

    CREATE INDEX IF NOT EXISTS financial_documents_org_vendor_idx
      ON public.financial_documents (org_id, vendor);

  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- accounts_expenses
-- ---------------------------------------------------------------------------
-- Table: accounts_expenses
-- Normalized expense facts derived from financial_documents.
-- v1 keeps a single "main" expense row per financial document.
DO $$
BEGIN
  -- Only create accounts_expenses if both organizations and financial_documents exist.
  IF to_regclass('public.organizations') IS NOT NULL
     AND to_regclass('public.financial_documents') IS NOT NULL THEN

    CREATE TABLE IF NOT EXISTS public.accounts_expenses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Tenant scoping
      org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,

      -- Source document
      financial_document_id uuid NOT NULL REFERENCES public.financial_documents (id) ON DELETE CASCADE,

      -- Normalized expense facts
      expense_date date NOT NULL,
      vendor text,
      category text NOT NULL,
      amount numeric NOT NULL CHECK (amount >= 0),
      currency text,

      -- Extraction quality
      is_estimated boolean NOT NULL DEFAULT false,
      confidence_score numeric,

      -- Timestamps
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );

  END IF;
END $$;

-- Indexes to support reporting (by period, category, vendor)
DO $$
BEGIN
  IF to_regclass('public.accounts_expenses') IS NOT NULL THEN

    CREATE INDEX IF NOT EXISTS accounts_expenses_org_date_idx
      ON public.accounts_expenses (org_id, expense_date DESC);

    CREATE INDEX IF NOT EXISTS accounts_expenses_org_category_idx
      ON public.accounts_expenses (org_id, category);

    CREATE INDEX IF NOT EXISTS accounts_expenses_org_vendor_idx
      ON public.accounts_expenses (org_id, vendor);

  END IF;
END $$;
