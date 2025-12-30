-- Metering events v1 (PGW1)
-- Minimal internal table for usage logging + admin sanity checks.

create extension if not exists pgcrypto;

create table if not exists public.metering_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id text not null,
  user_id uuid null,
  event_type text not null,
  amount numeric not null default 1,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists metering_events_created_at_idx
  on public.metering_events (created_at desc);

create index if not exists metering_events_org_event_idx
  on public.metering_events (org_id, event_type);

-- Internal/dev use (PGW1): rely on grants; keep RLS off for now.
grant select, insert on public.metering_events to anon, authenticated, service_role;

