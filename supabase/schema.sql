-- =============================================
-- ClientRegit Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text not null,
  avatar_url text,
  role text not null default 'editor' check (role in ('editor', 'client')),
  created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

-- Profiles: Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Profiles: Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Profiles: Insert policy for signup
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================
-- CLIENTS
-- =============================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  editor_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text not null,
  company text,
  phone text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.clients enable row level security;

-- Clients: Editors can manage their own clients
create policy "Editors can view own clients"
  on public.clients for select
  using (auth.uid() = editor_id);

create policy "Editors can insert own clients"
  on public.clients for insert
  with check (auth.uid() = editor_id);

create policy "Editors can update own clients"
  on public.clients for update
  using (auth.uid() = editor_id);

create policy "Editors can delete own clients"
  on public.clients for delete
  using (auth.uid() = editor_id);

-- Clients: Clients can see their own record (when logged in as client role)
create policy "Clients can view own record"
  on public.clients for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'client'
      and clients.email = profiles.email
    )
  );

-- =============================================
-- PROJECTS
-- =============================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  editor_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  budget numeric,
  start_date date,
  deadline date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'brief' check (status in ('brief', 'editing', 'review', 'revision', 'approved', 'delivered')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.projects enable row level security;

-- Projects: Editors can manage their own projects
create policy "Editors can view own projects"
  on public.projects for select
  using (auth.uid() = editor_id);

create policy "Editors can insert own projects"
  on public.projects for insert
  with check (auth.uid() = editor_id);

create policy "Editors can update own projects"
  on public.projects for update
  using (auth.uid() = editor_id);

create policy "Editors can delete own projects"
  on public.projects for delete
  using (auth.uid() = editor_id);

-- Projects: Clients can view projects linked to their client record
create policy "Clients can view assigned projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.clients
      where clients.id = projects.client_id
      and clients.email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- =============================================
-- TASKS
-- =============================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  assignee_id uuid references public.profiles(id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.tasks enable row level security;

-- Tasks: Editors can manage tasks on their projects
create policy "Editors can view own project tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.editor_id = auth.uid()
    )
  );

create policy "Editors can insert tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.editor_id = auth.uid()
    )
  );

create policy "Editors can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.editor_id = auth.uid()
    )
  );

create policy "Editors can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.editor_id = auth.uid()
    )
  );

-- Tasks: Clients can view tasks on their assigned projects
create policy "Clients can view assigned project tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects
      join public.clients on clients.id = projects.client_id
      where projects.id = tasks.project_id
      and clients.email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- =============================================
-- VIDEOS
-- =============================================
create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id) not null,
  title text not null,
  version integer not null default 1,
  file_path text not null,
  status text not null default 'draft' check (status in ('draft', 'awaiting_review', 'revision_requested', 'approved')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.videos enable row level security;

-- Videos: Editors can manage videos on their projects
create policy "Editors can view own project videos"
  on public.videos for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = videos.project_id
      and projects.editor_id = auth.uid()
    )
  );

create policy "Editors can insert videos"
  on public.videos for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = videos.project_id
      and projects.editor_id = auth.uid()
    )
  );

create policy "Editors can update videos"
  on public.videos for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = videos.project_id
      and projects.editor_id = auth.uid()
    )
  );

-- Videos: Clients can view videos on their assigned projects
create policy "Clients can view assigned project videos"
  on public.videos for select
  using (
    exists (
      select 1 from public.projects
      join public.clients on clients.id = projects.client_id
      where projects.id = videos.project_id
      and clients.email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- Videos: Clients can update status (approve/request changes)
create policy "Clients can update video status"
  on public.videos for update
  using (
    exists (
      select 1 from public.projects
      join public.clients on clients.id = projects.client_id
      where projects.id = videos.project_id
      and clients.email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- =============================================
-- VIDEO COMMENTS
-- =============================================
create table public.video_comments (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  timestamp numeric not null,
  comment text not null,
  created_at timestamp with time zone default now() not null
);

alter table public.video_comments enable row level security;

-- Video Comments: Users can view comments on videos they have access to
create policy "View comments on accessible videos"
  on public.video_comments for select
  using (
    exists (
      select 1 from public.videos
      join public.projects on projects.id = videos.project_id
      join public.clients on clients.id = projects.client_id
      where videos.id = video_comments.video_id
      and (
        projects.editor_id = auth.uid()
        or clients.email = (
          select email from public.profiles where id = auth.uid()
        )
      )
    )
  );

-- Video Comments: Users can insert comments on accessible videos
create policy "Insert comments on accessible videos"
  on public.video_comments for insert
  with check (
    exists (
      select 1 from public.videos
      join public.projects on projects.id = videos.project_id
      join public.clients on clients.id = projects.client_id
      where videos.id = video_comments.video_id
      and (
        projects.editor_id = auth.uid()
        or clients.email = (
          select email from public.profiles where id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- INVOICES
-- =============================================
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  invoice_number text not null unique,
  description text,
  amount numeric not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.invoices enable row level security;

-- Invoices: Editors can manage their invoices
create policy "Editors can view own invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.clients
      where clients.id = invoices.client_id
      and clients.editor_id = auth.uid()
    )
  );

create policy "Editors can insert invoices"
  on public.invoices for insert
  with check (
    exists (
      select 1 from public.clients
      where clients.id = invoices.client_id
      and clients.editor_id = auth.uid()
    )
  );

create policy "Editors can update invoices"
  on public.invoices for update
  using (
    exists (
      select 1 from public.clients
      where clients.id = invoices.client_id
      and clients.editor_id = auth.uid()
    )
  );

create policy "Editors can delete invoices"
  on public.invoices for delete
  using (
    exists (
      select 1 from public.clients
      where clients.id = invoices.client_id
      and clients.editor_id = auth.uid()
    )
  );

-- Invoices: Clients can view their own invoices
create policy "Clients can view own invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.clients
      where clients.id = invoices.client_id
      and clients.email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- =============================================
-- ACTIVITIES
-- =============================================
create table public.activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id) on delete set null,
  action text not null,
  description text not null,
  created_at timestamp with time zone default now() not null
);

alter table public.activities enable row level security;

-- Activities: Editors can view activities on their projects
create policy "Editors can view own activities"
  on public.activities for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = activities.project_id
      and projects.editor_id = auth.uid()
    )
  );

create policy "Editors can insert activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

-- Activities: Clients can view activities on their assigned projects
create policy "Clients can view assigned project activities"
  on public.activities for select
  using (
    exists (
      select 1 from public.projects
      join public.clients on clients.id = projects.client_id
      where projects.id = activities.project_id
      and clients.email = (
        select email from public.profiles where id = auth.uid()
      )
    )
  );

-- =============================================
-- STORAGE BUCKET
-- =============================================
insert into storage.buckets (id, name, public) values ('videos', 'videos', false);

-- Storage: Only authenticated users can upload
create policy "Authenticated users can upload videos"
  on storage.objects for insert
  with check (
    bucket_id = 'videos'
    and auth.role() = 'authenticated'
  );

-- Storage: Users can view videos they have access to
create policy "Users can view accessible videos"
  on storage.objects for select
  using (
    bucket_id = 'videos'
    and auth.role() = 'authenticated'
  );

-- Storage: Editors can delete their own uploaded videos
create policy "Editors can delete own videos"
  on storage.objects for delete
  using (
    bucket_id = 'videos'
    and auth.role() = 'authenticated'
  );

-- =============================================
-- FUNCTION: Auto-update updated_at
-- =============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.videos
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();