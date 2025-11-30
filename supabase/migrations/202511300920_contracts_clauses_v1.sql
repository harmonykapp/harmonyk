-- Week 12 Day 3 — Contract clauses + template clause mappings
-- This migration introduces:
-- - contract_clauses: global clause catalog
-- - contract_template_clauses: join table for templates → clauses
-- - clauses column on contract_metadata to track selected clause IDs for a contract

-- Global clauses catalog.
create table if not exists public.contract_clauses (
  id uuid primary key default gen_random_uuid(),

  -- Human-facing name, e.g. "Confidentiality (Mutual)"
  name text not null,

  -- Stable slug identifier for the clause, e.g. "confidentiality_mutual"
  slug text not null unique,

  -- High-level category: core_business, risk_liability, commercial_operational
  category text not null,

  -- Clause body (markdown or plain text)
  body text not null,

  -- alt_group groups variants of the same conceptual clause
  -- (e.g. different governing law or payment models)
  alt_group text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_clauses_category_idx
  on public.contract_clauses (category);

create index if not exists contract_clauses_alt_group_idx
  on public.contract_clauses (alt_group);

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
    create trigger set_contract_clauses_updated_at
      before update on public.contract_clauses
      for each row
      execute procedure public.set_current_timestamp_updated_at();
  end if;
end
$$;

-- Join table: which clauses are included in which templates, in which order.
create table if not exists public.contract_template_clauses (
  template_id uuid not null references public.contract_templates(id) on delete cascade,
  clause_id uuid not null references public.contract_clauses(id) on delete cascade,

  -- Order of the clause in the template
  order_idx integer not null default 0,

  -- Whether this clause is required for the default template
  required boolean not null default true,

  -- Optional alt_group for template-level variants (e.g. alternate clause set)
  alt_group text,

  primary key (template_id, clause_id, order_idx)
);

create index if not exists contract_template_clauses_template_id_idx
  on public.contract_template_clauses (template_id);

create index if not exists contract_template_clauses_clause_id_idx
  on public.contract_template_clauses (clause_id);

create index if not exists contract_template_clauses_alt_group_idx
  on public.contract_template_clauses (alt_group);

-- Track selected clause IDs for each contract (latest state) on contract_metadata.
-- This will be used by ClauseGraph v1 and later copied into version metadata
-- when versioning flows are wired.
alter table public.contract_metadata
  add column if not exists clauses jsonb not null default '[]'::jsonb;

create index if not exists contract_metadata_clauses_gin_idx
  on public.contract_metadata
  using gin (clauses);

-- Seed ~20 core clauses across three high-level categories.
-- Note: bodies are intentionally generic and should be refined over time.

insert into public.contract_clauses (id, name, slug, category, body, alt_group) values
  -- Core Business
  ('30000000-0000-0000-0000-000000000001',
   'Definitions',
   'definitions_standard',
   'core_business',
   'This clause defines key terms used throughout the agreement. Customize terms and definitions per deal.',
   'definitions_standard'),

  ('30000000-0000-0000-0000-000000000002',
   'Parties & Recitals',
   'parties_recitals_standard',
   'core_business',
   'This clause identifies the parties to the agreement and sets out the background recitals.',
   'parties_recitals_standard'),

  ('30000000-0000-0000-0000-000000000003',
   'Term & Termination (Standard)',
   'term_termination_standard',
   'core_business',
   'This clause defines the agreement term and standard termination rights.',
   'term_termination_standard'),

  ('30000000-0000-0000-0000-000000000004',
   'Governing Law & Jurisdiction (US-General)',
   'governing_law_us_general',
   'core_business',
   'This clause sets the governing law and jurisdiction for the agreement (US-general placeholder).',
   'governing_law_standard'),

  ('30000000-0000-0000-0000-000000000005',
   'Notices',
   'notices_standard',
   'core_business',
   'This clause describes how notices must be given under the agreement.',
   'notices_standard'),

  ('30000000-0000-0000-0000-000000000006',
   'Entire Agreement & Amendments',
   'entire_agreement_amendments',
   'core_business',
   'This clause states that the agreement is the entire agreement and describes how amendments must be made.',
   'entire_agreement_standard'),

  -- Risk & Liability
  ('30000000-0000-0000-0000-000000000007',
   'Confidentiality (Mutual)',
   'confidentiality_mutual',
   'risk_liability',
   'This clause imposes mutual confidentiality obligations on both parties.',
   'confidentiality_mutual_standard'),

  ('30000000-0000-0000-0000-000000000008',
   'Confidentiality (One-way)',
   'confidentiality_one_way',
   'risk_liability',
   'This clause imposes confidentiality obligations on the receiving party only.',
   'confidentiality_one_way_standard'),

  ('30000000-0000-0000-0000-000000000009',
   'Intellectual Property (Assignment)',
   'ip_assignment',
   'risk_liability',
   'This clause assigns intellectual property created under the agreement to one party.',
   'ip_assignment_standard'),

  ('30000000-0000-0000-0000-000000000010',
   'Intellectual Property (License)',
   'ip_license',
   'risk_liability',
   'This clause grants a license to use existing intellectual property.',
   'ip_license_standard'),

  ('30000000-0000-0000-0000-000000000011',
   'Limitation of Liability (Standard Cap)',
   'limitation_of_liability_cap',
   'risk_liability',
   'This clause limits each party''s liability to a capped amount and excludes indirect damages.',
   'limitation_of_liability_standard'),

  ('30000000-0000-0000-0000-000000000012',
   'Indemnity',
   'indemnity_standard',
   'risk_liability',
   'This clause sets out indemnity obligations between the parties.',
   'indemnity_standard'),

  ('30000000-0000-0000-0000-000000000013',
   'Dispute Resolution',
   'dispute_resolution_standard',
   'risk_liability',
   'This clause describes how disputes will be resolved (negotiation, mediation, arbitration, or courts).',
   'dispute_resolution_standard'),

  ('30000000-0000-0000-0000-000000000014',
   'Force Majeure',
   'force_majeure_standard',
   'risk_liability',
   'This clause excuses performance for events outside the parties'' reasonable control.',
   'force_majeure_standard'),

  -- Commercial & Operational
  ('30000000-0000-0000-0000-000000000015',
   'Scope of Work',
   'scope_of_work_standard',
   'commercial_operational',
   'This clause describes the services, deliverables, and responsibilities of each party.',
   'scope_of_work_standard'),

  ('30000000-0000-0000-0000-000000000016',
   'Payment Terms (Net 30)',
   'payment_terms_net_30',
   'commercial_operational',
   'This clause defines standard payment terms of net 30 days from invoice.',
   'payment_terms_net_30'),

  ('30000000-0000-0000-0000-000000000017',
   'Service Levels (SLA)',
   'service_levels_standard',
   'commercial_operational',
   'This clause defines service levels, uptime targets, and remedies for failures.',
   'sla_standard'),

  ('30000000-0000-0000-0000-000000000018',
   'Change Control',
   'change_control_standard',
   'commercial_operational',
   'This clause describes how changes to the services or scope are requested, approved, and documented.',
   'change_control_standard'),

  ('30000000-0000-0000-0000-000000000019',
   'Return of Materials & Data',
   'return_of_materials_data',
   'commercial_operational',
   'This clause describes how materials and data will be returned or destroyed at the end of the engagement.',
   'return_of_materials_standard'),

  ('30000000-0000-0000-0000-000000000020',
   'Survival',
   'survival_standard',
   'commercial_operational',
   'This clause lists which obligations survive termination or expiration of the agreement.',
   'survival_standard');

-- Map hero templates to a default set of clauses.
-- Template IDs from 202511300910_contracts_library_v1.sql.

insert into public.contract_template_clauses (template_id, clause_id, order_idx, required, alt_group) values
  -- Mutual NDA (Short)
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 10, true, null), -- Definitions
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 20, true, null), -- Parties & Recitals
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007', 30, true, 'confidentiality_mutual_standard'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 40, true, 'term_termination_standard'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 50, true, 'governing_law_standard'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 60, true, null),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 70, true, 'entire_agreement_standard'),

  -- One-way NDA
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 10, true, null),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 20, true, null),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000008', 30, true, 'confidentiality_one_way_standard'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 40, true, 'term_termination_standard'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 50, true, 'governing_law_standard'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 60, true, null),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', 70, true, 'entire_agreement_standard'),

  -- Employment Agreement (Standard)
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 10, true, null),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 20, true, null),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', 30, true, 'confidentiality_mutual_standard'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000009', 40, true, 'ip_assignment_standard'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000011', 50, true, 'limitation_of_liability_standard'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 60, true, 'term_termination_standard'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 70, true, 'governing_law_standard'),

  -- Master Services Agreement (MSA)
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 10, true, null),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 20, true, null),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000007', 30, true, 'confidentiality_mutual_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000009', 40, true, 'ip_assignment_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000015', 50, true, 'scope_of_work_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000016', 60, true, 'payment_terms_net_30'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000017', 70, true, 'sla_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000018', 80, true, 'change_control_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000011', 90, true, 'limitation_of_liability_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000012', 100, true, 'indemnity_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000014', 110, true, 'force_majeure_standard'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', 120, true, 'entire_agreement_standard');

