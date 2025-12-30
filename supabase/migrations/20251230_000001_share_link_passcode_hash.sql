-- PGW1: Real passcode-protected share links
-- Adds passcode_hash (sha256 hex) to share_link.
-- Note: we keep existing require_email for backward-compat; passcode enforcement is based on passcode_hash.

alter table public.share_link
  add column if not exists passcode_hash text null;

comment on column public.share_link.passcode_hash is
  'SHA-256 hex of passcode for share link gating (null means no passcode required).';

