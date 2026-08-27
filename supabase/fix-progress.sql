-- =============================================
-- FIX: Ensure progress column exists and is synced
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add progress column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'progress'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN progress integer not null default 0;
    RAISE NOTICE 'Added progress column';
  ELSE
    RAISE NOTICE 'progress column already exists';
  END IF;
END $$;

-- 2. Add constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_progress_check'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_progress_check CHECK (progress >= 0 AND progress <= 100);
    RAISE NOTICE 'Added progress check constraint';
  END IF;
END $$;

-- 3. Sync progress based on status for existing records
UPDATE public.projects SET progress = CASE
  WHEN status = 'brief' THEN 0
  WHEN status = 'editing' THEN 25
  WHEN status = 'review' THEN 50
  WHEN status = 'revision' THEN 60
  WHEN status = 'approved' THEN 80
  WHEN status = 'delivered' THEN 100
  ELSE 0
END
WHERE progress = 0 AND status != 'brief';

-- 4. Verify the column exists and show results
SELECT id, name, status, progress FROM public.projects LIMIT 10;
