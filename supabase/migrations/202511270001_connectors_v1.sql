-- Connectors v1 schema (Drive + optional Gmail)

-- Week 10 Day 1 – connector_accounts, connector_jobs, connector_files

-- NOTE:

-- - We deliberately keep provider/kind/status as text instead of enums

--   to avoid migration friction while we iterate.

-- - Owner/account/org relationships are kept generic (owner_id uuid)

--   and can be tightened later once we stabilise the org model.

create table if not exists public.connector_accounts (

  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null,

  provider text not null,

  status text not null default 'disconnected',

  token_json jsonb,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);

create index if not exists connector_accounts_owner_idx

  on public.connector_accounts (owner_id);

create index if not exists connector_accounts_provider_idx

  on public.connector_accounts (provider);

comment on table public.connector_accounts is

  'External connector accounts (e.g. Google Drive, Gmail) per owner/org.';

comment on column public.connector_accounts.owner_id is

  'Owner/org id – intentionally generic; wire to orgs/profiles in app code.';

comment on column public.connector_accounts.provider is

  'Connector provider identifier, e.g. google_drive, gmail.';

comment on column public.connector_accounts.status is

  'High-level status: connected / disconnected / error / pending.';



create table if not exists public.connector_jobs (

  id uuid primary key default gen_random_uuid(),

  account_id uuid not null references public.connector_accounts(id) on delete cascade,

  kind text not null,

  status text not null,

  started_at timestamptz default now(),

  finished_at timestamptz,

  attempts int not null default 0,

  last_error text,

  meta_json jsonb,

  created_at timestamptz not null default now()

);

create index if not exists connector_jobs_account_idx

  on public.connector_jobs (account_id);

create index if not exists connector_jobs_status_idx

  on public.connector_jobs (status);

create index if not exists connector_jobs_kind_idx

  on public.connector_jobs (kind);

comment on table public.connector_jobs is

  'Execution records for connector sync/import jobs.';

comment on column public.connector_jobs.kind is

  'Job kind, e.g. drive_import, gmail_import.';

comment on column public.connector_jobs.status is

  'pending / running / completed / failed.';



create table if not exists public.connector_files (

  id uuid primary key default gen_random_uuid(),

  account_id uuid not null references public.connector_accounts(id) on delete cascade,

  provider text not null,

  external_id text not null,

  title text,

  mime text,

  size bigint,

  modified_at timestamptz,

  url text,

  meta_json jsonb,

  created_at timestamptz not null default now()

);

create unique index if not exists connector_files_account_external_unique

  on public.connector_files (account_id, external_id);

create index if not exists connector_files_provider_idx

  on public.connector_files (provider);

create index if not exists connector_files_modified_at_idx

  on public.connector_files (modified_at);

comment on table public.connector_files is

  'Normalised metadata for files/items fetched from external connectors.';

comment on column public.connector_files.external_id is

  'Provider-specific id (e.g. Google Drive file id, Gmail message/thread id).';

comment on column public.connector_files.meta_json is

  'Raw provider metadata (owners, labels, attachment info, etc).';

