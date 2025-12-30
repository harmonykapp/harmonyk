-- Create share_link table used by /api/shares/create (PGW1)
-- This table is referenced throughout the app as the canonical "share link" record.
-- Safe to run on fresh local DB via `supabase db reset`.

-- Ensure crypto functions exist for UUID defaults
create extension if not exists pgcrypto;

-- Generic updated_at trigger helper (idempotent)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.share_link (
  id uuid primary key default gen_random_uuid(),

  org_id uuid not null,
  document_id uuid not null,
  version_id uuid,

  token text not null,
  label text,
  expires_at timestamptz,
  max_views int,
  require_email boolean not null default false,
  revoked_at timestamptz,

  created_by uuid not null,
  view_count bigint not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uniqueness + lookup indexes
create unique index if not exists idx_share_link_token on public.share_link (token);
create index if not exists idx_share_link_org on public.share_link (org_id);
create index if not exists idx_share_link_document on public.share_link (document_id);
create index if not exists idx_share_link_version on public.share_link (version_id);
create index if not exists idx_share_link_created_at on public.share_link (created_at);

-- Best-effort foreign keys (only add if referenced tables exist)
do $$
begin
  if to_regclass('public.org') is not null then
    begin
      alter table public.share_link
        add constraint share_link_org_id_fkey
        foreign key (org_id) references public.org(id) on delete cascade;
    exception when duplicate_object then
      null;
    end;
  end if;

  if to_regclass('public.document') is not null then
    begin
      alter table public.share_link
        add constraint share_link_document_id_fkey
        foreign key (document_id) references public.document(id) on delete cascade;
    exception when duplicate_object then
      null;
    end;
  end if;

  if to_regclass('public.version') is not null then
    begin
      alter table public.share_link
        add constraint share_link_version_id_fkey
        foreign key (version_id) references public.version(id) on delete set null;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

-- Auto-update updated_at
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tr_share_link_updated_at') then
    create trigger tr_share_link_updated_at
      before update on public.share_link
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- NOTE: RLS intentionally not added yet (PGW1 internal dev).

