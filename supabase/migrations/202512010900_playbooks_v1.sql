-- Week 17 Day 1: Playbooks schema and types stabilized for GA
-- Normalizes playbooks and playbook_runs tables to use org_id and enums.
-- This migration creates the normalized schema for the Playbooks execution engine.

-- =============================================================================
-- Enums
-- =============================================================================

-- Enum: playbook_trigger
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'playbook_trigger'
  ) then
    create type public.playbook_trigger as enum (
      'activity_event',
      'accounts_pack_run'
    );
  end if;
end
$$;

-- Note: If enum already exists with different values, manual migration may be needed
-- PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE

-- Enum: playbook_action
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'playbook_action'
  ) then
    create type public.playbook_action as enum (
      'log_activity',
      'enqueue_task'
    );
  end if;
end
$$;

-- Enum: playbook_status
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'playbook_status'
  ) then
    create type public.playbook_status as enum (
      'active',
      'inactive',
      'archived'
    );
  end if;
end
$$;

-- Enum: playbook_run_status
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'playbook_run_status'
  ) then
    create type public.playbook_run_status as enum (
      'pending',
      'success',
      'failed',
      'skipped'
    );
  end if;
end
$$;

-- =============================================================================
-- Table: playbooks
-- =============================================================================

-- Create playbooks table if it doesn't exist, or add missing columns
create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  name text not null,
  trigger public.playbook_trigger not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  status public.playbook_status not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_run_at timestamptz null
);

-- Add missing columns if table already exists
do $$
begin
  -- Add org_id if missing (migrating from owner_id)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbooks'
      and column_name = 'org_id'
  ) then
    alter table public.playbooks add column org_id uuid;
    -- NOTE: If you have legacy data using owner_id, you can backfill org_id via member table lookup in a maintenance window.
    -- NOTE: Do NOT enforce NOT NULL here; existing rows may have no org_id.
    -- A later migration can backfill org_id and tighten the constraint safely.
  end if;

  -- Add trigger column if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbooks'
      and column_name = 'trigger'
  ) then
    alter table public.playbooks add column trigger public.playbook_trigger;
    -- Set a default for existing rows
    update public.playbooks set trigger = 'activity_event' where trigger is null;
    alter table public.playbooks alter column trigger set not null;
  end if;

  -- Add conditions column if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbooks'
      and column_name = 'conditions'
  ) then
    alter table public.playbooks add column conditions jsonb not null default '[]'::jsonb;
  end if;

  -- Add actions column if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbooks'
      and column_name = 'actions'
  ) then
    alter table public.playbooks add column actions jsonb not null default '[]'::jsonb;
  end if;

  -- Migrate status from text to enum if needed
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbooks'
      and column_name = 'status'
      and data_type = 'text'
  ) then
    -- Add new enum column
    alter table public.playbooks add column status_new public.playbook_status;
    -- Map old status values to new enum
    update public.playbooks set status_new = case
      when status = 'enabled' then 'active'::public.playbook_status
      when status = 'disabled' then 'inactive'::public.playbook_status
      when status = 'draft' then 'inactive'::public.playbook_status
      else 'inactive'::public.playbook_status
    end;
    -- Drop old column and rename new one
    alter table public.playbooks drop column status;
    alter table public.playbooks rename column status_new to status;
    alter table public.playbooks alter column status set not null;
    alter table public.playbooks alter column status set default 'inactive';
  end if;

  -- Add last_run_at if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbooks'
      and column_name = 'last_run_at'
  ) then
    alter table public.playbooks add column last_run_at timestamptz null;
  end if;
end
$$;

-- Indexes for playbooks
create index if not exists playbooks_org_status_idx
  on public.playbooks (org_id, status);

create index if not exists playbooks_org_trigger_idx
  on public.playbooks (org_id, trigger);

-- =============================================================================
-- Table: playbook_runs
-- =============================================================================

-- Create playbook_runs table if it doesn't exist, or add missing columns
create table if not exists public.playbook_runs (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks(id) on delete cascade,
  org_id uuid,
  trigger_event jsonb not null,
  status public.playbook_run_status not null default 'pending',
  error text null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

-- Add missing columns if table already exists
do $$
begin
  -- Add org_id if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'org_id'
  ) then
    alter table public.playbook_runs add column org_id uuid;
    -- Backfill org_id from playbook where possible.
    -- NOTE: We do NOT enforce NOT NULL here; some legacy rows may not have a matching playbook/org.
    update public.playbook_runs pr
    set org_id = p.org_id
    from public.playbooks p
    where pr.playbook_id = p.id
      and pr.org_id is null;
  end if;

  -- Add trigger_event if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'trigger_event'
  ) then
    alter table public.playbook_runs add column trigger_event jsonb not null default '{}'::jsonb;
  end if;

  -- Migrate status from text to enum if needed
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'status'
      and data_type = 'text'
  ) then
    -- Add new enum column
    alter table public.playbook_runs add column status_new public.playbook_run_status;
    -- Map old status values to new enum
    update public.playbook_runs set status_new = case
      when status = 'started' then 'pending'::public.playbook_run_status
      when status = 'completed' then 'success'::public.playbook_run_status
      when status = 'failed' then 'failed'::public.playbook_run_status
      when status = 'dry_run' then 'success'::public.playbook_run_status
      else 'pending'::public.playbook_run_status
    end;
    -- Drop old column and rename new one
    alter table public.playbook_runs drop column status;
    alter table public.playbook_runs rename column status_new to status;
    alter table public.playbook_runs alter column status set not null;
    alter table public.playbook_runs alter column status set default 'pending';
  end if;

  -- Add error column if missing
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'error'
  ) then
    alter table public.playbook_runs add column error text null;
  end if;

  -- Add metrics column if missing (or rename stats_json)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'metrics'
  ) then
    -- Check if stats_json exists and migrate it
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'playbook_runs'
        and column_name = 'stats_json'
    ) then
      alter table public.playbook_runs rename column stats_json to metrics;
      alter table public.playbook_runs alter column metrics set default '{}'::jsonb;
    else
      alter table public.playbook_runs add column metrics jsonb not null default '{}'::jsonb;
    end if;
  end if;

  -- Add created_at if missing (needed for indexes)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'created_at'
  ) then
    -- For legacy rows, we default created_at to now().
    -- This is acceptable because we don't rely on historical ordering for old data,
    -- only for new GA playbook runs.
    alter table public.playbook_runs
      add column created_at timestamptz not null default now();
  end if;

  -- Add completed_at if missing (or rename from started_at/completed_at if needed)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'playbook_runs'
      and column_name = 'completed_at'
  ) then
    alter table public.playbook_runs add column completed_at timestamptz null;
  end if;
end
$$;

-- Indexes for playbook_runs
create index if not exists playbook_runs_org_created_at_idx
  on public.playbook_runs (org_id, created_at desc);

create index if not exists playbook_runs_playbook_created_at_idx
  on public.playbook_runs (playbook_id, created_at desc);

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Enable RLS on playbooks
alter table public.playbooks enable row level security;

-- RLS Policy: org members can select playbooks
drop policy if exists playbooks_org_members_select on public.playbooks;

create policy playbooks_org_members_select
  on public.playbooks
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = playbooks.org_id
        and m.user_id = auth.uid()
    )
  );

-- RLS Policy: org members can insert playbooks
drop policy if exists playbooks_org_members_insert on public.playbooks;

create policy playbooks_org_members_insert
  on public.playbooks
  for insert
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = playbooks.org_id
        and m.user_id = auth.uid()
    )
  );

-- RLS Policy: org members can update playbooks
drop policy if exists playbooks_org_members_update on public.playbooks;

create policy playbooks_org_members_update
  on public.playbooks
  for update
  using (
    exists (
      select 1 from public.member m
      where m.org_id = playbooks.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = playbooks.org_id
        and m.user_id = auth.uid()
    )
  );

-- RLS Policy: org members can delete playbooks
drop policy if exists playbooks_org_members_delete on public.playbooks;

create policy playbooks_org_members_delete
  on public.playbooks
  for delete
  using (
    exists (
      select 1 from public.member m
      where m.org_id = playbooks.org_id
        and m.user_id = auth.uid()
    )
  );

-- Enable RLS on playbook_runs
alter table public.playbook_runs enable row level security;

-- RLS Policy: org members can select playbook_runs
drop policy if exists playbook_runs_org_members_select on public.playbook_runs;

create policy playbook_runs_org_members_select
  on public.playbook_runs
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = playbook_runs.org_id
        and m.user_id = auth.uid()
    )
  );

-- Note: playbook_runs insert/update/delete should only be done by server-side code
-- We do NOT create insert/update/delete policies for playbook_runs to enforce this.

