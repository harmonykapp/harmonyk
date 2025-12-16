-- Maestro Memory v1 schema
-- Week 9 – org/user profiles + template usage logging

begin;

-- 1) Enums -------------------------------------------------------------------

-- mono_tone: how Maestro should speak/write
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'mono_tone'
  ) then
    create type public.mono_tone as enum (
      'formal',
      'neutral',
      'friendly',
      'punchy',
      'technical'
    );
  end if;
end $$;

-- mono_risk_profile: how conservative vs aggressive the legal posture is
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'mono_risk_profile'
  ) then
    create type public.mono_risk_profile as enum (
      'conservative',
      'balanced',
      'aggressive'
    );
  end if;
end $$;

-- 2) Generic updated_at trigger function -------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) mono_org_profile --------------------------------------------------------

create table if not exists public.mono_org_profile (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text,
  default_tone public.mono_tone not null default 'neutral',
  default_risk_profile public.mono_risk_profile not null default 'balanced',
  default_jurisdiction text not null default 'us',
  default_locale text not null default 'en-US',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional FK to an organizations table if it exists.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'organizations'
  ) then
    alter table public.mono_org_profile
      drop constraint if exists mono_org_profile_org_id_fkey,
      add constraint mono_org_profile_org_id_fkey
        foreign key (org_id) references public.organizations (id)
        on delete cascade;
  end if;
end $$;

drop trigger if exists mono_org_profile_set_updated_at on public.mono_org_profile;
create trigger mono_org_profile_set_updated_at
before update on public.mono_org_profile
for each row execute procedure public.set_updated_at();

-- 4) mono_user_profile -------------------------------------------------------

create table if not exists public.mono_user_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid,
  preferred_tone public.mono_tone,
  preferred_risk_profile public.mono_risk_profile,
  preferred_jurisdiction text,
  preferred_locale text,
  role text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional FKs to auth.users and organizations (if they exist).
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    alter table public.mono_user_profile
      drop constraint if exists mono_user_profile_user_id_fkey,
      add constraint mono_user_profile_user_id_fkey
        foreign key (user_id) references auth.users (id)
        on delete cascade;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'organizations'
  ) then
    alter table public.mono_user_profile
      drop constraint if exists mono_user_profile_org_id_fkey,
      add constraint mono_user_profile_org_id_fkey
        foreign key (org_id) references public.organizations (id)
        on delete set null;
  end if;
end $$;

drop trigger if exists mono_user_profile_set_updated_at on public.mono_user_profile;
create trigger mono_user_profile_set_updated_at
before update on public.mono_user_profile
for each row execute procedure public.set_updated_at();

-- 5) mono_template_usage -----------------------------------------------------

create table if not exists public.mono_template_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid,
  builder_type text not null,
  template_key text not null,
  clause_key text,
  usage_count integer not null default 1,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mono_template_usage
  add constraint mono_template_usage_builder_type_check
    check (builder_type in ('contract', 'deck', 'accounting'));

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    alter table public.mono_template_usage
      drop constraint if exists mono_template_usage_user_id_fkey,
      add constraint mono_template_usage_user_id_fkey
        foreign key (user_id) references auth.users (id)
        on delete cascade;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'organizations'
  ) then
    alter table public.mono_template_usage
      drop constraint if exists mono_template_usage_org_id_fkey,
      add constraint mono_template_usage_org_id_fkey
        foreign key (org_id) references public.organizations (id)
        on delete set null;
  end if;
end $$;

drop trigger if exists mono_template_usage_set_updated_at on public.mono_template_usage;
create trigger mono_template_usage_set_updated_at
before update on public.mono_template_usage
for each row execute procedure public.set_updated_at();

create index if not exists idx_mono_template_usage_user_builder
  on public.mono_template_usage (user_id, builder_type);

create index if not exists idx_mono_template_usage_template_key
  on public.mono_template_usage (template_key);

commit;

