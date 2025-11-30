-- Week 14 — Accounts Builder v1
-- Accounts scanner data model: financial_documents + accounts_expenses (+ enums)

-- Enum: type of financial document detected from connectors
create type public.financial_doc_type as enum (
  'receipt',
  'invoice',
  'bank_statement',
  'pl_export',
  'tax_notice',
  'other'
);

-- Enum: supported accounts report types (for metadata / future use)
create type public.accounts_report_type as enum (
  'monthly_expenses',
  'investor_accounts_snapshot'
);

-- Table: financial_documents
-- One row per Gmail/Drive item that has been classified as financial.
create table public.financial_documents (
  id uuid primary key default gen_random_uuid(),

  -- Tenant scoping
  org_id uuid not null references public.organizations (id) on delete cascade,

  -- Where this document came from
  -- For GA we only support Google connectors
  source_connector text not null check (source_connector in ('gmail', 'drive')),
  external_id text not null,

  -- Optional link to a Vault document if/when it is vaulted
  vault_document_id uuid references public.documents (id) on delete set null,

  -- Classification
  financial_doc_type public.financial_doc_type not null default 'other',
  vendor text,
  doc_date date,
  currency text,
  amount_total numeric,
  confidence_score numeric,

  -- Raw connector metadata / AI classification context
  raw_metadata jsonb not null default '{}'::jsonb,

  -- Timestamps
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  -- Avoid duplicate rows per org + connector item
  unique (org_id, source_connector, external_id)
);

-- Indexes to support common inbox queries
create index if not exists financial_documents_org_date_idx
  on public.financial_documents (org_id, doc_date desc nulls last);

create index if not exists financial_documents_org_type_confidence_idx
  on public.financial_documents (org_id, financial_doc_type, confidence_score);

create index if not exists financial_documents_org_vendor_idx
  on public.financial_documents (org_id, vendor);

-- Table: accounts_expenses
-- Normalized expense facts derived from financial_documents.
-- v1 keeps a single "main" expense row per financial document.
create table public.accounts_expenses (
  id uuid primary key default gen_random_uuid(),

  -- Tenant scoping
  org_id uuid not null references public.organizations (id) on delete cascade,

  -- Source document
  financial_document_id uuid not null references public.financial_documents (id) on delete cascade,

  -- Normalized expense facts
  expense_date date not null,
  vendor text,
  category text not null,
  amount numeric not null check (amount >= 0),
  currency text,

  -- Extraction quality
  is_estimated boolean not null default false,
  confidence_score numeric,

  -- Timestamps
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Indexes to support reporting (by period, category, vendor)
create index if not exists accounts_expenses_org_date_idx
  on public.accounts_expenses (org_id, expense_date desc);

create index if not exists accounts_expenses_org_category_idx
  on public.accounts_expenses (org_id, category);

create index if not exists accounts_expenses_org_vendor_idx
  on public.accounts_expenses (org_id, vendor);

