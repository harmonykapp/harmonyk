-- Week 12 Day 1 — Contracts metadata + status model
-- Defines contract categories, statuses, and a metadata table for contracts.

-- Enum for contract categories under "Legal Contracts":
-- 1) Operational & HR
-- 2) Corporate & Finance
-- 3) Commercial & Dealmaking
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'contract_category'
  ) then
    create type public.contract_category as enum (
      'operational_hr',
      'corporate_finance',
      'commercial_dealmaking'
    );
  end if;
end
$$;

-- Enum for contract lifecycle statuses:
-- draft → in_review → approved → signed → active → expired
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'contract_status'
  ) then
    create type public.contract_status as enum (
      'draft',
      'in_review',
      'approved',
      'signed',
      'active',
      'expired'
    );
  end if;
end
$$;

-- Metadata table for contracts.
-- This table is org-scoped and links a contract document (in Vault)
-- to its category, canonical type, status, and template metadata.
create table if not exists public.contract_metadata (
  id uuid primary key default gen_random_uuid(),

  -- org/user scoping
  org_id uuid not null,
  doc_id uuid not null,

  -- link to the primary template and canonical type
  primary_template_id uuid,
  canonical_type text not null,

  -- category + status
  category public.contract_category not null,
  status public.contract_status not null default 'draft',

  -- lightweight tags for search/filtering (e.g. nda, msa, hr, equity)
  tags text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_metadata_org_id_idx
  on public.contract_metadata (org_id);

create index if not exists contract_metadata_doc_id_idx
  on public.contract_metadata (doc_id);

create index if not exists contract_metadata_status_idx
  on public.contract_metadata (status);

create index if not exists contract_metadata_category_idx
  on public.contract_metadata (category);

-- Reuse the standard updated_at trigger if it exists.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_current_timestamp_updated_at'
  ) then
    create trigger set_contract_metadata_updated_at
      before update on public.contract_metadata
      for each row
      execute procedure public.set_current_timestamp_updated_at();
  end if;
end
$$;

