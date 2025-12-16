-- Week 13 Day 1 — Decks library schema + initial seeds
-- Defines the global deck templates catalog used by the Decks Builder.

-- Enum for deck types:
-- - fundraising: Seed/Pre-Seed fundraising decks
-- - investor_update: Regular investor update decks
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'deck_type'
  ) then
    create type public.deck_type as enum (
      'fundraising',
      'investor_update'
    );
  end if;
end
$$;

-- Global deck templates catalog.
-- This catalog is global (not org-scoped) and is safe to read across orgs.
create table if not exists public.deck_templates (
  id uuid primary key default gen_random_uuid(),

  -- Human-facing name, e.g. "Fundraising Deck (Seed/Pre-Seed)"
  name text not null,

  -- Deck type identifier
  deck_type public.deck_type not null,

  -- True if this is the primary canonical template for this type
  is_canonical boolean not null default false,

  -- Optional description of the template
  description text,

  -- Tag array for search/filtering (e.g. '{seed,pre_seed,fundraising}')
  tags text[] not null default '{}'::text[],

  -- Default outline structure (JSON array of section keys)
  default_outline jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deck_templates_deck_type_is_canonical_idx
  on public.deck_templates (deck_type, is_canonical);

create index if not exists deck_templates_deck_type_idx
  on public.deck_templates (deck_type);

create index if not exists deck_templates_tags_gin_idx
  on public.deck_templates
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
    create trigger set_deck_templates_updated_at
      before update on public.deck_templates
      for each row
      execute procedure public.set_current_timestamp_updated_at();
  end if;
end
$$;

-- Deck sections define the canonical outline for each template.
-- Each section represents a slide/section in the deck.
create table if not exists public.deck_sections (
  id uuid primary key default gen_random_uuid(),

  -- Link to the template this section belongs to
  template_id uuid not null references public.deck_templates(id) on delete cascade,

  -- Stable key identifier for the section (snake_case), e.g. 'problem', 'solution'
  section_key text not null,

  -- Human-readable title for the section
  title text not null,

  -- Order of the section in the deck (sequential starting from 1)
  order_idx integer not null,

  -- Optional prompt for Maestro to guide content generation for this section
  default_prompt text,

  -- Whether this section is required for the template
  is_required boolean not null default true,

  created_at timestamptz not null default now()
);

create index if not exists deck_sections_template_id_order_idx_idx
  on public.deck_sections (template_id, order_idx);

create index if not exists deck_sections_template_id_idx
  on public.deck_sections (template_id);

-- Initial seed: 2 canonical templates for GA.

-- Fundraising Deck (Seed/Pre-Seed)
insert into public.deck_templates (id, name, deck_type, is_canonical, description, tags, default_outline)
values
  ('40000000-0000-0000-0000-000000000001',
   'Fundraising Deck (Seed/Pre-Seed)',
   'fundraising',
   true,
   'Standard fundraising deck template for seed and pre-seed rounds. Covers problem, solution, market, product, traction, business model, go-to-market, team, financials, and ask.',
   '{seed,pre_seed,fundraising,investor_pitch}',
   '["problem","solution","market","product","traction","business_model","go_to_market","team","financials","ask"]'::jsonb);

-- Fundraising Deck sections
insert into public.deck_sections (id, template_id, section_key, title, order_idx, default_prompt, is_required)
values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'problem', 'Problem', 1, 'Describe the core problem your startup is solving. Be specific about pain points and why existing solutions fall short.', true),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'solution', 'Solution', 2, 'Explain your solution and how it addresses the problem. Highlight what makes your approach unique.', true),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'market', 'Market', 3, 'Define your target market size (TAM, SAM, SOM) and explain market dynamics and growth potential.', true),
  ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'product', 'Product', 4, 'Describe your product, key features, and how it works. Include mockups or screenshots if available.', true),
  ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001', 'traction', 'Traction', 5, 'Showcase your traction: early customers, revenue, growth metrics, partnerships, or other validation signals.', true),
  ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000001', 'business_model', 'Business Model', 6, 'Explain how you make money, pricing strategy, unit economics, and revenue streams.', true),
  ('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000001', 'go_to_market', 'Go-to-Market', 7, 'Describe your go-to-market strategy, customer acquisition channels, and sales approach.', true),
  ('41000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000001', 'team', 'Team', 8, 'Introduce your founding team and key advisors. Highlight relevant experience and expertise.', true),
  ('41000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000001', 'financials', 'Financials', 9, 'Present key financial projections, burn rate, use of funds, and key assumptions. Keep it high-level for early stage.', true),
  ('41000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000001', 'ask', 'Ask', 10, 'Specify your funding ask, terms, and what you plan to achieve with this round.', true);

-- Investor Update Deck
insert into public.deck_templates (id, name, deck_type, is_canonical, description, tags, default_outline)
values
  ('40000000-0000-0000-0000-000000000002',
   'Investor Update Deck',
   'investor_update',
   true,
   'Standard template for regular investor updates. Covers summary, highlights, product updates, growth metrics, roadmap, and asks.',
   '{investor_update,reporting,quarterly,monthly}',
   '["summary","highlights","product","growth","metrics","roadmap","asks"]'::jsonb);

-- Investor Update Deck sections
insert into public.deck_sections (id, template_id, section_key, title, order_idx, default_prompt, is_required)
values
  ('42000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'summary', 'Executive Summary', 1, 'Provide a high-level summary of key achievements, challenges, and priorities for this period.', true),
  ('42000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'highlights', 'Key Highlights', 2, 'List the most important wins, milestones, or developments since the last update.', true),
  ('42000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'product', 'Product Updates', 3, 'Share major product releases, features, or improvements. Include customer feedback if relevant.', true),
  ('42000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'growth', 'Growth & Sales', 4, 'Highlight customer acquisition, revenue growth, key deals, or expansion efforts.', true),
  ('42000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'metrics', 'Key Metrics', 5, 'Present key performance indicators: MRR, ARR, CAC, LTV, retention, or other relevant metrics.', true),
  ('42000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', 'roadmap', 'Roadmap', 6, 'Outline upcoming priorities, product roadmap, and strategic initiatives for the next period.', true),
  ('42000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002', 'asks', 'Asks', 7, 'Specify how investors can help: introductions, expertise, resources, or other support needed.', true);

