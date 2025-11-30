-- Tasks schema repair migration
-- Week 12 Day 3 – Fix outdated tasks table schema
-- Safely repairs the tasks table if it has an outdated schema (missing org_id column)

begin;

-- Check if the table exists and has the wrong schema, then drop and recreate
do $$
begin
  -- Check if tasks table exists
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'tasks'
  ) then
    -- Check if org_id column is missing (indicates old schema)
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tasks'
        and column_name = 'org_id'
    ) then
      -- Drop the old table with outdated schema
      drop table if exists public.tasks cascade;
      raise notice 'Dropped old tasks table with outdated schema';
    end if;
  end if;
end $$;

-- Create the tasks table with correct schema (will only create if it doesn't exist)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid,
  source text not null check (source in ('activity', 'mono', 'manual')),
  title text not null,
  status text not null check (status in ('open', 'done')),
  due_at timestamptz,
  doc_id uuid,
  activity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional FK to org table if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'org'
  ) then
    alter table public.tasks
      drop constraint if exists tasks_org_id_fkey,
      add constraint tasks_org_id_fkey
        foreign key (org_id) references public.org (id)
        on delete cascade;
  end if;
end $$;

-- Optional FK to auth.users if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    alter table public.tasks
      drop constraint if exists tasks_user_id_fkey,
      add constraint tasks_user_id_fkey
        foreign key (user_id) references auth.users (id)
        on delete set null;
  end if;
end $$;

-- Optional FK to document table if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'document'
  ) then
    alter table public.tasks
      drop constraint if exists tasks_doc_id_fkey,
      add constraint tasks_doc_id_fkey
        foreign key (doc_id) references public.document (id)
        on delete set null;
  end if;
end $$;

-- Optional FK to activity_log table if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'activity_log'
  ) then
    alter table public.tasks
      drop constraint if exists tasks_activity_id_fkey,
      add constraint tasks_activity_id_fkey
        foreign key (activity_id) references public.activity_log (id)
        on delete set null;
  end if;
end $$;

-- Create updated_at trigger function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at trigger
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

-- Create indexes for efficient queries
create index if not exists idx_tasks_org_id on public.tasks (org_id);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_source on public.tasks (source);
create index if not exists idx_tasks_due_at on public.tasks (due_at);
create index if not exists idx_tasks_org_status on public.tasks (org_id, status);
create index if not exists idx_tasks_org_source on public.tasks (org_id, source);

commit;

