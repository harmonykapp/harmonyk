-- supabase_schema_week1.sql
-- Week-1 schema snapshot for Harmonyk (dev; RLS OFF)
-- Create required extension(s)
create extension if not exists pgcrypto;

-- =====================================================
-- documents
-- =====================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  status text not null check (status in ('draft','shared','signed','archived')),
  created_at timestamptz not null default now()
);
create index if not exists documents_owner_id_idx on public.documents (owner_id);
create index if not exists documents_status_idx on public.documents (status);

-- =====================================================
-- versions
-- =====================================================
create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.documents(id) on delete cascade,
  number int not null,
  content_url text not null,
  checksum text,
  created_at timestamptz not null default now(),
  unique (doc_id, number)
);
create index if not exists versions_doc_id_idx on public.versions (doc_id);

-- =====================================================
-- shares
-- =====================================================
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.documents(id) on delete cascade,
  created_by uuid not null,
  access text not null check (access in ('public','passcode')),
  passcode_hash text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists shares_doc_id_idx on public.shares (doc_id);
-- predicate must be immutable → move to full index or leave simple index above
create index if not exists shares_doc_id_expires_idx on public.shares (doc_id, expires_at);

-- =====================================================
-- events
-- =====================================================
create table if not exists public.events (
  id bigserial primary key,
  doc_id uuid references public.documents(id) on delete set null,
  event_type text not null check (event_type in ('view','download','share_created','analyze','preview')),
  actor uuid,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_doc_id_idx on public.events (doc_id, created_at desc);
create index if not exists events_actor_idx on public.events (actor, created_at desc);
create index if not exists events_type_idx on public.events (event_type);

-- =====================================================
-- roles
-- =====================================================
create table if not exists public.roles (
  user_id uuid primary key,
  role text not null check (role in ('admin','editor','user'))
);
create index if not exists roles_role_idx on public.roles (role);

-- =====================================================
-- tasks (Calendar & Tasks Lite)
-- =====================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  status text not null check (status in ('todo','doing','done')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_due_idx on public.tasks(due_at);

-- =====================================================
-- calendar_events (Calendar & Tasks Lite)
-- =====================================================
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_at timestamptz not null default now()
);
create index if not exists cal_user_id_idx on public.calendar_events(user_id);
create index if not exists cal_starts_idx on public.calendar_events(starts_at);

-- =====================================================
-- Notes:
-- - RLS intentionally OFF for local dev speed; will be enabled & authored in Week 11.
-- - events.event_type already includes future types ('analyze','preview') for Week-2 wiring.
-- - shares: simple index used; advanced partial indexes can be added later when needed.
