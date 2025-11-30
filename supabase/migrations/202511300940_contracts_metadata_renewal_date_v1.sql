-- Week 12 Day 6 — Contract renewal metadata (renewal_date) for Tasks/Playbooks glue
-- This migration adds a renewal_date field to contract_metadata so that
-- Playbooks and Tasks can compute renewal reminders (e.g. 30 days before).

alter table public.contract_metadata
  add column if not exists renewal_date date;

create index if not exists contract_metadata_renewal_date_idx
  on public.contract_metadata (renewal_date);

comment on column public.contract_metadata.renewal_date is
  'Optional contract renewal or expiry date used to drive renewal Playbooks and Tasks.';

-- Optional: lightweight check constraint to ensure renewal_date is not absurdly old.
alter table public.contract_metadata
  add constraint contract_metadata_renewal_date_not_too_old
  check (
    renewal_date is null
    or renewal_date > date '2000-01-01'
  ) not valid;

-- Mark the constraint as valid separately to avoid locking large tables.
alter table public.contract_metadata
  validate constraint contract_metadata_renewal_date_not_too_old;

