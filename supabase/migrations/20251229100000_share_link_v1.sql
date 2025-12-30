-- Share links v1 (Harmonyk)
-- Creates public.share_link for Share Hub / share URL generation.

create table if not exists public.share_link (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org(id) on delete cascade,
  document_id uuid not null references public.document(id) on delete cascade,
  version_id uuid references public.version(id) on delete set null,

  token text not null unique,
  label text,
  require_email boolean not null default false,
  expires_at timestamptz,
  max_views integer,
  view_count integer not null default 0,
  revoked_at timestamptz,

  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_share_link_org_id on public.share_link (org_id);
create index if not exists idx_share_link_document_id on public.share_link (document_id);
create index if not exists idx_share_link_version_id on public.share_link (version_id);
create index if not exists idx_share_link_created_at on public.share_link (created_at desc);

-- Lightweight updated_at trigger (re-use existing helper if present)
do $$
begin
  if to_regclass('public.docsafe_set_updated_at') is not null then
    if not exists (
      select 1 from pg_trigger where tgname = 'tr_share_link_updated_at'
    ) then
      create trigger tr_share_link_updated_at
      before update on public.share_link
      for each row execute function public.docsafe_set_updated_at();
    end if;
  end if;
end $$;

-- NOTE: RLS intentionally not enabled yet.
-- If you later enable RLS, add policies based on org membership (member table).

