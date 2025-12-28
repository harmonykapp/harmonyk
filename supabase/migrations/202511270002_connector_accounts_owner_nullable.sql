-- Week 10 – Connectors v1
-- Make connector_accounts.owner_id nullable so we can attach accounts
-- before the org/user model is fully wired.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'connector_accounts'
      AND column_name  = 'owner_id'
  ) THEN
    ALTER TABLE public.connector_accounts
      ALTER COLUMN owner_id DROP NOT NULL;
  END IF;
END $$;


