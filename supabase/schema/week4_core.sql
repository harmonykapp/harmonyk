-- Week 4 core schema snapshot
-- Harmonyk – Supabase core tables + RLS
-- NOTE: Run this once in Supabase SQL editor, then keep it as a snapshot.

-- Extension (usually already enabled in Supabase, but harmless if re-run)
create extension if not exists "pgcrypto";

----------------------------------------------------------------------
-- app_user – app-level profile, mapped to auth.users
----------------------------------------------------------------------
create table if not exists public.app_user (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_user_auth_user_id_idx on public.app_user (auth_user_id);

----------------------------------------------------------------------
-- org – organizations / workspaces
----------------------------------------------------------------------
create table if not exists public.org (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  plan text not null default 'free', -- free | starter | pro | enterprise
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_slug_idx on public.org (slug);

----------------------------------------------------------------------
-- member – user membership in orgs
----------------------------------------------------------------------
create table if not exists public.member (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member', -- owner | admin | member
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists member_org_id_idx on public.member (org_id);
create index if not exists member_user_id_idx on public.member (user_id);

----------------------------------------------------------------------
-- source_account – external connectors (Google Drive, OneDrive, etc.)
----------------------------------------------------------------------
create table if not exists public.source_account (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  provider text not null,              -- e.g. 'google_drive', 'onedrive', 'dropbox', 'documenso'
  external_account_id text not null,   -- provider-side id/email
  status text not null default 'active', -- active | revoked | error
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider, external_account_id)
);

create index if not exists source_account_org_id_idx on public.source_account (org_id);
create index if not exists source_account_user_id_idx on public.source_account (user_id);

----------------------------------------------------------------------
-- document – canonical docs in Vault / Builder
----------------------------------------------------------------------
create table if not exists public.document (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete restrict,
  title text not null,
  kind text not null default 'contract', -- contract | deck | statement | other
  status text not null default 'draft',  -- draft | active | archived
  current_version_id uuid,              -- back-reference; set via app logic
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists document_org_id_idx on public.document (org_id);
create index if not exists document_owner_id_idx on public.document (owner_id);

----------------------------------------------------------------------
-- unified_item – Workbench row (any doc from any source)
----------------------------------------------------------------------
create table if not exists public.unified_item (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  source text not null,           -- 'google_drive' | 'vault' | 'upload' | 'documenso' | etc.
  kind text not null,             -- 'contract' | 'deck' | 'statement' | 'file' | ...
  title text not null,
  mime_type text,
  source_account_id uuid references public.source_account (id) on delete set null,
  external_item_id text,          -- provider-specific id (file id, share id, etc.)
  document_id uuid references public.document (id) on delete set null,
  status text not null default 'active', -- active | archived
  last_indexed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists unified_item_org_id_idx on public.unified_item (org_id);
create index if not exists unified_item_source_idx on public.unified_item (source, kind);

----------------------------------------------------------------------
-- version – versioned content for a document
----------------------------------------------------------------------
create table if not exists public.version (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  document_id uuid not null references public.document (id) on delete cascade,
  number integer not null, -- 1, 2, 3...
  title text,
  content text,            -- rendered markdown / html / docx json etc.
  storage_path text,       -- path or URL in storage (GCS, S3, etc.)
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, number)
);

create index if not exists version_org_id_idx on public.version (org_id);
create index if not exists version_document_id_idx on public.version (document_id);

----------------------------------------------------------------------
-- share_link – DocSend-style share URLs
----------------------------------------------------------------------
create table if not exists public.share_link (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  document_id uuid not null references public.document (id) on delete cascade,
  version_id uuid references public.version (id) on delete set null,
  token text not null unique,           -- used in public URL
  label text,
  expires_at timestamptz,
  max_views integer,
  view_count integer not null default 0,
  require_email boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists share_link_org_id_idx on public.share_link (org_id);
create index if not exists share_link_document_id_idx on public.share_link (document_id);

----------------------------------------------------------------------
-- envelope – e-sign envelopes (Documenso, later Track-3)
----------------------------------------------------------------------
create table if not exists public.envelope (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  document_id uuid not null references public.document (id) on delete cascade,
  version_id uuid references public.version (id) on delete set null,
  provider text not null default 'documenso',
  provider_envelope_id text not null,   -- external id
  status text not null default 'draft', -- draft | sent | completed | cancelled | failed
  created_by uuid not null references auth.users (id) on delete restrict,
  sent_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists envelope_org_id_idx on public.envelope (org_id);
create index if not exists envelope_document_id_idx on public.envelope (document_id);

----------------------------------------------------------------------
-- activity_log – key events for audit / telemetry
----------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  type text not null, -- vault_save | share_created | analyze_completed | builder_generate | version_saved | version_restore | ...
  document_id uuid references public.document (id) on delete set null,
  version_id uuid references public.version (id) on delete set null,
  unified_item_id uuid references public.unified_item (id) on delete set null,
  share_link_id uuid references public.share_link (id) on delete set null,
  envelope_id uuid references public.envelope (id) on delete set null,
  context jsonb, -- extra payload
  created_at timestamptz not null default now()
);

create index if not exists activity_log_org_id_idx on public.activity_log (org_id);
create index if not exists activity_log_type_idx on public.activity_log (type);

----------------------------------------------------------------------
-- template – contract templates
----------------------------------------------------------------------
create table if not exists public.template (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org (id) on delete cascade, -- null = global
  name text not null,
  category text not null, -- 'core_operational' | 'corporate_finance' | 'commercial_deal' | ...
  description text,
  default_prompt text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists template_org_id_idx on public.template (org_id);
create index if not exists template_category_idx on public.template (category);

----------------------------------------------------------------------
-- clause – reusable clauses library
----------------------------------------------------------------------
create table if not exists public.clause (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org (id) on delete cascade, -- null = global
  name text not null,
  category text not null, -- 'core_business' | 'risk_liability' | 'commercial_operational'
  jurisdiction text,      -- e.g. 'US', 'UK', 'EU', etc.
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clause_org_id_idx on public.clause (org_id);
create index if not exists clause_category_idx on public.clause (category);

----------------------------------------------------------------------
-- RLS: org-scoped tables
--   document, version, share_link, envelope, activity_log, unified_item
-- Policy: only users who are members of the org can see rows.
----------------------------------------------------------------------

alter table public.document      enable row level security;
alter table public.version       enable row level security;
alter table public.share_link    enable row level security;
alter table public.envelope      enable row level security;
alter table public.activity_log  enable row level security;
alter table public.unified_item  enable row level security;

-- document -----------------------------------------------------------

drop policy if exists document_org_members_select on public.document;
drop policy if exists document_org_members_mod    on public.document;

create policy document_org_members_select
  on public.document
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = document.org_id
        and m.user_id = auth.uid()
    )
  );

create policy document_org_members_mod
  on public.document
  for all
  using (
    exists (
      select 1 from public.member m
      where m.org_id = document.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = document.org_id
        and m.user_id = auth.uid()
    )
  );

-- version ------------------------------------------------------------

drop policy if exists version_org_members_select on public.version;
drop policy if exists version_org_members_mod    on public.version;

create policy version_org_members_select
  on public.version
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = version.org_id
        and m.user_id = auth.uid()
    )
  );

create policy version_org_members_mod
  on public.version
  for all
  using (
    exists (
      select 1 from public.member m
      where m.org_id = version.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = version.org_id
        and m.user_id = auth.uid()
    )
  );

-- share_link ---------------------------------------------------------

drop policy if exists share_link_org_members_select on public.share_link;
drop policy if exists share_link_org_members_mod    on public.share_link;

create policy share_link_org_members_select
  on public.share_link
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = share_link.org_id
        and m.user_id = auth.uid()
    )
  );

create policy share_link_org_members_mod
  on public.share_link
  for all
  using (
    exists (
      select 1 from public.member m
      where m.org_id = share_link.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = share_link.org_id
        and m.user_id = auth.uid()
    )
  );

-- envelope -----------------------------------------------------------

drop policy if exists envelope_org_members_select on public.envelope;
drop policy if exists envelope_org_members_mod    on public.envelope;

create policy envelope_org_members_select
  on public.envelope
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = envelope.org_id
        and m.user_id = auth.uid()
    )
  );

create policy envelope_org_members_mod
  on public.envelope
  for all
  using (
    exists (
      select 1 from public.member m
      where m.org_id = envelope.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = envelope.org_id
        and m.user_id = auth.uid()
    )
  );

-- unified_item -------------------------------------------------------

drop policy if exists unified_item_org_members_select on public.unified_item;
drop policy if exists unified_item_org_members_mod    on public.unified_item;

create policy unified_item_org_members_select
  on public.unified_item
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = unified_item.org_id
        and m.user_id = auth.uid()
    )
  );

create policy unified_item_org_members_mod
  on public.unified_item
  for all
  using (
    exists (
      select 1 from public.member m
      where m.org_id = unified_item.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = unified_item.org_id
        and m.user_id = auth.uid()
    )
  );

-- activity_log -------------------------------------------------------

drop policy if exists activity_log_org_members_select on public.activity_log;

create policy activity_log_org_members_select
  on public.activity_log
  for select
  using (
    exists (
      select 1 from public.member m
      where m.org_id = activity_log.org_id
        and m.user_id = auth.uid()
    )
  );
