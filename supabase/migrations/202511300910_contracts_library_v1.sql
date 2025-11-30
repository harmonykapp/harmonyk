-- Week 12 Day 2 — Contracts library schema + initial seeds
-- Defines the global contract templates catalog used by the Contracts Builder.

-- Note:
-- - Categories reuse public.contract_category from 202511300900_contracts_meta_v1.sql
-- - This catalog is global (not org-scoped) and is safe to read across orgs.

-- Optional enum for risk level; keep flexible but constrained.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'risk_level'
  ) then
    create type public.risk_level as enum ('low', 'medium', 'high');
  end if;
end
$$;

create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),

  -- Human-facing name, e.g. "Mutual NDA (Short)"
  name text not null,

  -- Logical type identifier used by the app/AI, e.g. "nda_mutual", "employment_agreement"
  canonical_type text not null,

  -- Primary category for navigation in the 3-level legal tree
  category public.contract_category not null,

  -- True if this is the primary canonical template for this type
  is_canonical boolean not null default true,

  -- Alternate variants share the same canonical_type and alt_group,
  -- but have is_canonical = false (used by AI/RAG and advanced users).
  alt_group text,

  -- Tag array for search/filtering (e.g. '{nda,hr}', '{msa,services}')
  tags text[] not null default '{}',

  -- Risk level (rough guide only)
  risk public.risk_level default 'medium',

  -- Baseline jurisdiction (e.g. 'US-general', 'US-DE', 'AU', 'EU'), optional
  jurisdiction text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_templates_canonical_type_idx
  on public.contract_templates (canonical_type);

create index if not exists contract_templates_category_idx
  on public.contract_templates (category);

create index if not exists contract_templates_is_canonical_idx
  on public.contract_templates (is_canonical);

create index if not exists contract_templates_alt_group_idx
  on public.contract_templates (alt_group);

create index if not exists contract_templates_tags_gin_idx
  on public.contract_templates
  using gin (tags);

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
    create trigger set_contract_templates_updated_at
      before update on public.contract_templates
      for each row
      execute procedure public.set_current_timestamp_updated_at();
  end if;
end
$$;

-- Initial seed: hero templates for GA.
-- Note: This is a subset of the full ~45 template library.
-- Additional templates will be seeded in later migrations.

insert into public.contract_templates (id, name, canonical_type, category, is_canonical, alt_group, tags, risk, jurisdiction)
values
  -- Operational & HR
  ('20000000-0000-0000-0000-000000000001',
   'Mutual NDA (Short)',
   'nda_mutual',
   'operational_hr',
   true,
   'nda_mutual_standard',
   '{nda,confidentiality,operational_hr,commercial_dealmaking}',
   'low',
   'US-general'),

  ('20000000-0000-0000-0000-000000000002',
   'One-way NDA',
   'nda_one_way',
   'operational_hr',
   true,
   'nda_one_way_standard',
   '{nda,confidentiality,operational_hr,commercial_dealmaking}',
   'low',
   'US-general'),

  ('20000000-0000-0000-0000-000000000003',
   'Employment Agreement (Standard)',
   'employment_agreement',
   'operational_hr',
   true,
   'employment_standard',
   '{employment,hr,operational_hr}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000004',
   'Independent Contractor Agreement (Individual)',
   'contractor_individual',
   'operational_hr',
   true,
   'contractor_individual_standard',
   '{contractor,services,operational_hr}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000005',
   'Master Services Agreement (MSA)',
   'msa_services',
   'operational_hr',
   true,
   'msa_services_standard',
   '{msa,services,operational_hr,commercial_dealmaking}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000006',
   'Statement of Work (SOW) – General',
   'sow_general',
   'operational_hr',
   true,
   'sow_general_standard',
   '{sow,services,operational_hr}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000007',
   'SaaS Subscription Agreement (Standard)',
   'saas_subscription_standard',
   'operational_hr',
   true,
   'saas_standard',
   '{saas,subscription,operational_hr,commercial_dealmaking}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000008',
   'Data Processing Addendum (Short Form)',
   'dpa_short',
   'operational_hr',
   true,
   'dpa_short_standard',
   '{dpa,data,privacy,operational_hr}',
   'medium',
   'EU'),

  ('20000000-0000-0000-0000-000000000009',
   'Online Privacy Policy',
   'privacy_policy_online',
   'operational_hr',
   true,
   'privacy_policy_online_standard',
   '{privacy,website,operational_hr}',
   'medium',
   'US-general'),

  -- Corporate & Finance
  ('20000000-0000-0000-0000-000000000010',
   'Share Purchase Agreement',
   'share_purchase_agreement',
   'corporate_finance',
   true,
   'spa_standard',
   '{equity,share_purchase,corporate_finance}',
   'high',
   'US-general'),

  ('20000000-0000-0000-0000-000000000011',
   'Asset Purchase Agreement',
   'asset_purchase_agreement',
   'corporate_finance',
   true,
   'apa_standard',
   '{asset_purchase,corporate_finance}',
   'high',
   'US-general'),

  ('20000000-0000-0000-0000-000000000012',
   'Founders Agreement',
   'founders_agreement',
   'corporate_finance',
   true,
   'founders_standard',
   '{founders,corporate_finance}',
   'medium',
   'US-general'),

  -- Commercial & Dealmaking
  ('20000000-0000-0000-0000-000000000013',
   'Memorandum of Understanding (MOU)',
   'mou_general',
   'commercial_dealmaking',
   true,
   'mou_standard',
   '{mou,commercial_dealmaking}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000014',
   'Letter of Intent (LOI)',
   'loi_general',
   'commercial_dealmaking',
   true,
   'loi_standard',
   '{loi,commercial_dealmaking}',
   'medium',
   'US-general'),

  ('20000000-0000-0000-0000-000000000015',
   'Reseller Agreement',
   'reseller_agreement',
   'commercial_dealmaking',
   true,
   'reseller_standard',
   '{reseller,commercial_dealmaking}',
   'medium',
   'US-general');

