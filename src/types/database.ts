export type UserRole = 'editor' | 'client'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Client {
  id: string
  editor_id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  editor_id: string
  name: string
  description: string | null
  budget: number | null
  start_date: string | null
  deadline: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'brief' | 'editing' | 'review' | 'revision' | 'approved' | 'delivered'
  progress: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  assignee_id: string | null
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  project_id: string
  uploaded_by: string
  title: string
  version: number
  file_path: string
  status: 'draft' | 'awaiting_review' | 'revision_requested' | 'approved'
  created_at: string
  updated_at: string
}

export interface VideoComment {
  id: string
  video_id: string
  user_id: string
  timestamp: number
  comment: string
  created_at: string
}

export interface Invoice {
  id: string
  client_id: string
  project_id: string | null
  invoice_number: string
  description: string | null
  amount: number
  issue_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  project_id: string | null
  action: string
  description: string
  created_at: string
}

export interface ClientWithProjects extends Client {
  projects: Project[]
}

export interface ProjectWithDetails extends Project {
  client: Client
  tasks: Task[]
  videos: Video[]
  invoices: Invoice[]
}

export interface VideoWithComments extends Video {
  comments: VideoComment[]
  uploader: Profile
}