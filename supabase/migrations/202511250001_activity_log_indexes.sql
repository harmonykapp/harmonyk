-- Week 8: ActivityLog indexes for Insights & Activity filters
-- This migration is defensive: it only creates indexes if the columns exist.

-- owner_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'owner_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_activity_log_owner_created_at
      ON public.activity_log (owner_id, created_at DESC);
  END IF;
END $$;

-- document_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'document_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_activity_log_document_created_at
      ON public.activity_log (document_id, created_at DESC);
  END IF;
END $$;

-- event_type + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'event_type'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_activity_log_event_created_at
      ON public.activity_log (event_type, created_at DESC);
  END IF;
END $$;

-- Optional: workspace_id + created_at (useful for multi-owner workspace views)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'workspace_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_log'
      AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_activity_log_workspace_created_at
      ON public.activity_log (workspace_id, created_at DESC);
  END IF;
END $$;

