-- LEGACY REFERENCE ONLY (DO NOT RUN AS A MIGRATION)
-- Week 7 Day 1: original Playbooks core tables (owner_id-based)
--
-- Why this exists:
-- - Historical reference for early Playbooks schema.
-- - Superseded by org_id-based normalized schema in:
--   supabase/migrations/202512010900_playbooks_v1.sql
--
-- Important:
-- - This file is intentionally NOT under supabase/migrations/
--   because it does not match current schema direction and would
--   create noise/conflicts in fresh environments.

create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status text not null check (status in ('draft', 'enabled', 'disabled')) default 'draft',
  scope_json jsonb not null default '{}'::jsonb,
  definition_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playbook_runs (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks (id) on delete cascade,
  status text not null check (status in ('started', 'completed', 'failed', 'dry_run')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  stats_json jsonb not null default '{}'::jsonb
);

create table if not exists public.playbook_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.playbook_runs (id) on delete cascade,
  step_idx integer not null,
  type text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  status text not null check (status in ('pending', 'started', 'completed', 'skipped', 'failed')) default 'pending',
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_playbooks_owner_status
  on public.playbooks (owner_id, status);

create index if not exists idx_playbook_runs_playbook_started_at
  on public.playbook_runs (playbook_id, started_at desc);

create index if not exists idx_playbook_steps_run_idx
  on public.playbook_steps (run_id, step_idx);

comment on table public.playbooks is 'Legacy Week7 Playbooks definitions (owner_id-based).';
comment on table public.playbook_runs is 'Legacy Week7 Playbooks runs.';
comment on table public.playbook_steps is 'Legacy Week7 Playbooks per-step logs.';

