-- Fix: Add missing cascade deletes so users can be deleted from Supabase dashboard
-- Run this in Supabase SQL Editor

-- Drop existing foreign keys and re-add with cascade
ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_user_id_fkey,
  ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_project_id_fkey,
  ADD CONSTRAINT activities_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Also ensure tasks assignee has cascade
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey,
  ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure video_comments user_id has cascade
ALTER TABLE public.video_comments
  DROP CONSTRAINT IF EXISTS video_comments_user_id_fkey,
  ADD CONSTRAINT video_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure videos uploaded_by has cascade
ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_uploaded_by_fkey,
  ADD CONSTRAINT videos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;