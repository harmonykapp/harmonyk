-- Week 16 Day 1 — Accounts Pack Runs schema
-- Defines the accounts_pack_runs table for tracking pack execution runs.

-- Enum: type of accounts pack
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'accounts_pack_type'
  ) then
    create type public.accounts_pack_type as enum (
      'saas_monthly_expenses',
      'investor_accounts_snapshot'
    );
  end if;
end
$$;

-- Enum: status of a pack run
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'accounts_pack_status'
  ) then
    create type public.accounts_pack_status as enum (
      'success',
      'failure',
      'partial'
    );
  end if;
end
$$;

-- Table: accounts_pack_runs
-- Tracks execution runs of accounts packs (e.g., monthly expense reports, investor snapshots).
create table public.accounts_pack_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  type public.accounts_pack_type not null,
  period_start date,
  period_end date,
  status public.accounts_pack_status not null default 'success',
  metrics jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Composite index for common queries: org + type + created_at
create index accounts_pack_runs_org_type_created_at_idx
  on public.accounts_pack_runs (org_id, type, created_at desc);

-- Enable RLS
alter table public.accounts_pack_runs enable row level security;

-- RLS Policy: org members can select
drop policy if exists accounts_pack_runs_org_members_select on public.accounts_pack_runs;

DO $$
BEGIN
  IF to_regclass('public.accounts_pack_runs') IS NOT NULL
     AND to_regclass('public.member') IS NOT NULL THEN

    DROP POLICY IF EXISTS accounts_pack_runs_org_members_select
      ON public.accounts_pack_runs;

    CREATE POLICY accounts_pack_runs_org_members_select
      ON public.accounts_pack_runs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.member m
          WHERE m.org_id = accounts_pack_runs.org_id
            AND m.user_id = auth.uid()
        )
      );

  END IF;
END $$;


-- RLS Policy: org members can insert
drop policy if exists accounts_pack_runs_org_members_insert on public.accounts_pack_runs;

create policy accounts_pack_runs_org_members_insert
  on public.accounts_pack_runs
  for insert
  with check (
    exists (
      select 1 from public.member m
      where m.org_id = accounts_pack_runs.org_id
        and m.user_id = auth.uid()
    )
  );

