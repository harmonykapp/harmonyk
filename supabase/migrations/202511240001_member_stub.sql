-- Local-first hardening: ensure public.member exists so RLS policy migrations compile
-- Safe on remote: if public.member already exists, CREATE TABLE IF NOT EXISTS does nothing.
-- Purpose: many migrations reference public.member (org_id, user_id) in policies.
-- Without this, fresh local supabase start can fail before later migrations (DocSafe scaffolding etc).

create table if not exists public.member (
  id uuid primary key default gen_random_uuid(),

  -- The only columns required by existing policy SQL
  org_id uuid not null,
  user_id uuid not null,

  -- Optional metadata (won't break anything if unused)
  role text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  -- Avoid duplicate membership rows
  unique (org_id, user_id)
);

-- Indexes to make org/user membership checks fast
create index if not exists member_org_id_idx
  on public.member (org_id);

create index if not exists member_user_id_idx
  on public.member (user_id);

-- Note:
-- This file is intentionally "minimal". If your canonical membership table differs,
-- keep it as-is on remote. This stub is mainly to stop local migrations from failing.

