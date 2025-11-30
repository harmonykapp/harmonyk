-- Tasks schema v1 (org-scoped)
-- Week 12 Day 3 – Task Hub & Notifications v1
-- Replaces the old user-scoped tasks table with org-scoped version

begin;

-- Drop old user-scoped tasks table if it exists (force drop to ensure clean slate)
drop table if exists public.tasks cascade;

-- Create new org-scoped tasks table
create table public.tasks (
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

-- Indexes for efficient queries
create index if not exists idx_tasks_org_id on public.tasks (org_id);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_source on public.tasks (source);
create index if not exists idx_tasks_due_at on public.tasks (due_at);
create index if not exists idx_tasks_org_status on public.tasks (org_id, status);
create index if not exists idx_tasks_org_source on public.tasks (org_id, source);

commit;

