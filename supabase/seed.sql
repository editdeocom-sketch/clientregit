-- =============================================
-- ClientRegit Seed Data
-- Run AFTER schema.sql
-- Replace '63769c08-1d22-4add-8efc-cfac22e0be39' with your auth user ID
-- =============================================

-- First, create a demo editor profile (replace the UUID with your actual auth user ID)
-- INSERT INTO public.profiles (id, full_name, email, role) VALUES
-- ('63769c08-1d22-4add-8efc-cfac22e0be39', 'Alex Kumar', 'alex@clientregit.com', 'editor');

-- =============================================
-- CLIENTS
-- =============================================
INSERT INTO public.clients (editor_id, name, email, company, phone, notes, status) VALUES
('63769c08-1d22-4add-8efc-cfac22e0be39', 'Rahul Media', 'rahul@rahulmedia.com', 'Rahul Media Productions', '+91 98765 43210', 'Long-term client, prefers quick turnarounds', 'active'),
('63769c08-1d22-4add-8efc-cfac22e0be39', 'Pixel Studios', 'contact@pixelstudios.in', 'Pixel Studios', '+91 98765 43211', 'Creative agency, handles brand campaigns', 'active'),
('63769c08-1d22-4add-8efc-cfac22e0be39', 'Creator Labs', 'hello@creatorlabs.in', 'Creator Labs', '+91 98765 43212', 'Content creator, YouTube focused', 'active'),
('63769c08-1d22-4add-8efc-cfac22e0be39', 'ABC Marketing', 'projects@abcmarketing.com', 'ABC Marketing Pvt Ltd', '+91 98765 43213', 'Corporate marketing team', 'active');

-- =============================================
-- PROJECTS
-- =============================================
INSERT INTO public.projects (client_id, editor_id, name, description, budget, start_date, deadline, priority, status, progress) VALUES
((SELECT id FROM public.clients WHERE name = 'Rahul Media' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'YouTube Episode 42', 'Full episode edit with color grading and sound design', 25000, '2026-11-01', '2026-12-15', 'high', 'review', 80),
((SELECT id FROM public.clients WHERE name = 'Pixel Studios' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'Instagram Reel Campaign', '10 Instagram Reels for product launch', 15000, '2026-11-15', '2026-12-20', 'medium', 'revision', 60),
((SELECT id FROM public.clients WHERE name = 'Creator Labs' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'Product Commercial', '30-second product commercial for social media', 35000, '2026-11-20', '2026-12-10', 'high', 'brief', 15),
((SELECT id FROM public.clients WHERE name = 'ABC Marketing' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'Podcast Episode 18', 'Full podcast edit with intro/outro and transitions', 8000, '2026-12-01', '2026-12-25', 'low', 'editing', 40),
((SELECT id FROM public.clients WHERE name = 'Rahul Media' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'Wedding Highlights Film', 'Cinematic wedding highlights 5-minute film', 45000, '2026-12-05', '2027-01-15', 'high', 'brief', 5);

-- =============================================
-- TASKS
-- =============================================
INSERT INTO public.tasks (project_id, title, description, status, priority, due_date) VALUES
((SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), 'Rough cut assembly', 'Assemble all footage into rough timeline', 'done', 'high', '2026-11-15'),
((SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), 'Color grading', 'Apply color correction and grading', 'review', 'high', '2026-12-01'),
((SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), 'Sound design', 'Add background music and sound effects', 'in_progress', 'medium', '2026-12-05'),
((SELECT id FROM public.projects WHERE name = 'Instagram Reel Campaign' LIMIT 1), 'Edit Reel 1-3', 'Edit first three reels', 'done', 'high', '2026-11-25'),
((SELECT id FROM public.projects WHERE name = 'Instagram Reel Campaign' LIMIT 1), 'Edit Reel 4-7', 'Edit reels four through seven', 'in_progress', 'high', '2026-12-05'),
((SELECT id FROM public.projects WHERE name = 'Instagram Reel Campaign' LIMIT 1), 'Edit Reel 8-10', 'Edit remaining reels', 'todo', 'medium', '2026-12-15'),
((SELECT id FROM public.projects WHERE name = 'Product Commercial' LIMIT 1), 'Gather footage', 'Collect and organize all provided footage', 'todo', 'high', '2026-12-01'),
((SELECT id FROM public.projects WHERE name = 'Product Commercial' LIMIT 1), 'Create storyboard', 'Plan visual sequence and timing', 'in_progress', 'medium', '2026-12-05'),
((SELECT id FROM public.projects WHERE name = 'Podcast Episode 18' LIMIT 1), 'Edit audio', 'Clean up audio and remove noise', 'in_progress', 'high', '2026-12-15'),
((SELECT id FROM public.projects WHERE name = 'Podcast Episode 18' LIMIT 1), 'Add intro/outro', 'Create and add branded intro and outro', 'todo', 'medium', '2026-12-20');

-- =============================================
-- VIDEOS
-- =============================================
INSERT INTO public.videos (project_id, uploaded_by, title, version, file_path, status) VALUES
((SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'YouTube Episode 42 - Final Cut', 3, 'videos/youtube-ep42/v3/final.mp4', 'awaiting_review'),
((SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'YouTube Episode 42 - Rough Cut', 2, 'videos/youtube-ep42/v2/rough.mp4', 'approved'),
((SELECT id FROM public.projects WHERE name = 'Instagram Reel Campaign' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'Instagram Reels 1-3 Draft', 1, 'videos/reel-campaign/v1/reels-1-3.mp4', 'revision_requested'),
((SELECT id FROM public.projects WHERE name = 'Podcast Episode 18' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 'Podcast Ep 18 - Edit v1', 1, 'videos/podcast-ep18/v1/edit.mp4', 'draft');

-- =============================================
-- VIDEO COMMENTS
-- =============================================
INSERT INTO public.video_comments (video_id, user_id, timestamp, comment) VALUES
((SELECT id FROM public.videos WHERE title = 'YouTube Episode 42 - Final Cut' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 14, 'Make the title sequence bigger and more prominent'),
((SELECT id FROM public.videos WHERE title = 'YouTube Episode 42 - Final Cut' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 27, 'Replace this shot with the alternative take'),
((SELECT id FROM public.videos WHERE title = 'YouTube Episode 42 - Final Cut' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 65, 'Great transition here, keep this!'),
((SELECT id FROM public.videos WHERE title = 'YouTube Episode 42 - Final Cut' LIMIT 1), '63769c08-1d22-4add-8efc-cfac22e0be39', 105, 'Can we add background music starting from here?');

-- =============================================
-- INVOICES
-- =============================================
INSERT INTO public.invoices (client_id, project_id, invoice_number, description, amount, issue_date, due_date, status) VALUES
((SELECT id FROM public.clients WHERE name = 'Rahul Media' LIMIT 1), (SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), 'INV-2608-0001', 'YouTube Episode 42 - Editing & Color Grading', 25000, '2026-11-01', '2026-12-01', 'paid'),
((SELECT id FROM public.clients WHERE name = 'Pixel Studios' LIMIT 1), (SELECT id FROM public.projects WHERE name = 'Instagram Reel Campaign' LIMIT 1), 'INV-2608-0002', 'Instagram Reel Campaign - Batch 1', 8000, '2026-11-20', '2026-12-20', 'sent'),
((SELECT id FROM public.clients WHERE name = 'Creator Labs' LIMIT 1), (SELECT id FROM public.projects WHERE name = 'Product Commercial' LIMIT 1), 'INV-2608-0003', 'Product Commercial - Pre-production', 10000, '2026-12-01', '2026-12-31', 'draft'),
((SELECT id FROM public.clients WHERE name = 'ABC Marketing' LIMIT 1), (SELECT id FROM public.projects WHERE name = 'Podcast Episode 18' LIMIT 1), 'INV-2608-0004', 'Podcast Episode 18 - Full Edit', 8000, '2026-12-05', '2026-12-05', 'overdue'),
((SELECT id FROM public.clients WHERE name = 'Rahul Media' LIMIT 1), NULL, 'INV-2608-0005', 'Wedding Highlights Film - Deposit', 15000, '2026-12-10', '2027-01-10', 'draft');

-- =============================================
-- ACTIVITIES
-- =============================================
INSERT INTO public.activities (user_id, project_id, action, description) VALUES
('63769c08-1d22-4add-8efc-cfac22e0be39', (SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), 'status_change', 'YouTube Episode 42 moved to Review'),
('63769c08-1d22-4add-8efc-cfac22e0be39', (SELECT id FROM public.projects WHERE name = 'Instagram Reel Campaign' LIMIT 1), 'comment', 'New comment on Instagram Reel Campaign'),
('63769c08-1d22-4add-8efc-cfac22e0be39', NULL, 'payment', 'Invoice INV-2608-0001 marked as paid'),
('63769c08-1d22-4add-8efc-cfac22e0be39', (SELECT id FROM public.projects WHERE name = 'Product Commercial' LIMIT 1), 'created', 'Product Commercial project created'),
('63769c08-1d22-4add-8efc-cfac22e0be39', (SELECT id FROM public.projects WHERE name = 'YouTube Episode 42' LIMIT 1), 'video_upload', 'New video uploaded: YouTube Episode 42 v3');