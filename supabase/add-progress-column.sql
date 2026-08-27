-- Run this in Supabase SQL Editor if progress column is missing
-- This adds the progress column to projects table if it doesn't exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'progress'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN progress integer not null default 0;
  END IF;
END $$;

-- Ensure progress constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_progress_check'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_progress_check CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;
