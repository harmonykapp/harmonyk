-- Connectors v1 schema
-- Week 9 – Google Drive + optional Gmail

-- NOTE:
-- - Adjust auth/profiles FK targets if your user table differs.
-- - If these tables already exist, align columns / constraints manually.

begin;

-- 1) connector_accounts

create table if not exists public.connector_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,
  provider_account_id text not null,
  display_name text,
  status text not null default 'connected',
  last_sync_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- You may need to point this at your profiles table instead, depending on the app.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'auth' and table_name = 'users'
  ) then
    alter table public.connector_accounts
      drop constraint if exists connector_accounts_user_id_fkey,
      add constraint connector_accounts_user_id_fkey
        foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

-- One active account per provider per user (v1 assumption).
create unique index if not exists idx_connector_accounts_user_provider
  on public.connector_accounts (user_id, provider);

alter table public.connector_accounts
  add constraint connector_accounts_status_check
    check (status in ('connected', 'error', 'revoked', 'disconnected'));

-- 2) connector_jobs

create table if not exists public.connector_jobs (
  id uuid primary key default gen_random_uuid(),
  connector_account_id uuid not null,
  job_type text not null,
  status text not null default 'pending',
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  backoff_seconds integer not null default 0,
  last_error_message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.connector_jobs
  drop constraint if exists connector_jobs_connector_account_id_fkey,
  add constraint connector_jobs_connector_account_id_fkey
    foreign key (connector_account_id)
    references public.connector_accounts (id)
    on delete cascade;

alter table public.connector_jobs
  add constraint connector_jobs_status_check
    check (status in ('pending', 'running', 'success', 'failed', 'cancelled'));

create index if not exists idx_connector_jobs_account
  on public.connector_jobs (connector_account_id);

create index if not exists idx_connector_jobs_status_scheduled
  on public.connector_jobs (status, scheduled_at);

-- 3) connector_files

create table if not exists public.connector_files (
  id uuid primary key default gen_random_uuid(),
  connector_account_id uuid not null,
  provider text not null,
  provider_file_id text not null,
  vault_document_id uuid,
  path text,
  name text,
  mime_type text,
  size_bytes bigint,
  modified_at timestamptz,
  sync_status text not null default 'pending',
  last_sync_job_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connector_files
  drop constraint if exists connector_files_connector_account_id_fkey,
  add constraint connector_files_connector_account_id_fkey
    foreign key (connector_account_id)
    references public.connector_accounts (id)
    on delete cascade;

-- If your vault documents table is named differently, adjust this FK.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'vault_documents'
  ) then
    alter table public.connector_files
      drop constraint if exists connector_files_vault_document_id_fkey,
      add constraint connector_files_vault_document_id_fkey
        foreign key (vault_document_id)
        references public.vault_documents (id)
        on delete set null;
  end if;
end $$;

alter table public.connector_files
  add constraint connector_files_sync_status_check
    check (sync_status in ('pending', 'synced', 'skipped', 'error'));

alter table public.connector_files
  drop constraint if exists connector_files_last_sync_job_id_fkey,
  add constraint connector_files_last_sync_job_id_fkey
    foreign key (last_sync_job_id)
    references public.connector_jobs (id)
    on delete set null;

-- Uniqueness + indexes

create unique index if not exists idx_connector_files_unique_external
  on public.connector_files (connector_account_id, provider_file_id);

create index if not exists idx_connector_files_vault_document
  on public.connector_files (vault_document_id);

create index if not exists idx_connector_files_provider_status
  on public.connector_files (provider, sync_status);

commit;

