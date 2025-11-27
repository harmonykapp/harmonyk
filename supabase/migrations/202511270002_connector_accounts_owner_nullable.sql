-- Week 10 – Connectors v1
-- Make connector_accounts.owner_id nullable so we can attach accounts
-- before the org/user model is fully wired.

alter table public.connector_accounts
  alter column owner_id drop not null;

