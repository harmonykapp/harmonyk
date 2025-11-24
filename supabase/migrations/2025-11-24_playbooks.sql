-- Week 7 Day 1: Playbooks core tables
-- NOTE:
-- 1) Run this in Supabase SQL Editor against your database.
-- 2) Keep this file in the repo as the migration source of truth.

create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status text not null check (status in ('draft', 'enabled', 'disabled')) default 'draft',
  -- Scope is where this playbook can run: selection/folder/tag/Saved View, etc.
  scope_json jsonb not null default '{}'::jsonb,
  -- Full playbook definition: triggers, conditions, actions, wait, retry, etc.
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
  -- Aggregate stats for Insights: counts, time_saved_estimate, errors, etc.
  stats_json jsonb not null default '{}'::jsonb
);

create table if not exists public.playbook_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.playbook_runs (id) on delete cascade,
  -- 0-based or 1-based step index within a run; deterministic ordering.
  step_idx integer not null,
  -- e.g. "trigger", "condition", "action", "wait", "retry"
  type text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  status text not null check (status in ('pending', 'started', 'completed', 'skipped', 'failed')) default 'pending',
  started_at timestamptz,
  completed_at timestamptz
);

-- Indexes to support Week 7 requirements
create index if not exists idx_playbooks_owner_status
  on public.playbooks (owner_id, status);

create index if not exists idx_playbook_runs_playbook_started_at
  on public.playbook_runs (playbook_id, started_at desc);

create index if not exists idx_playbook_steps_run_idx
  on public.playbook_steps (run_id, step_idx);

comment on table public.playbooks is 'Deterministic Playbooks definitions (Triggers/Conditions/Actions/Wait/Retry).';
comment on table public.playbook_runs is 'Execution runs of Playbooks, including dry-run simulations.';
comment on table public.playbook_steps is 'Per-step logs for each Playbook run, used for logs/undo and Insights.';

-- TODO (Week 7 Day 5):
-- Seed library templates (Inbound NDA, Aging Proposals, Receipt→Vault) once you have
-- a stable pattern for owner_id / workspace ownership. Keep seed inserts in a separate
-- migration or admin script.

