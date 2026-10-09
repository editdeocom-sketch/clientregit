import { existsSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { getDb, newId, now, round2 } from '../database'
import type {
  FileKind,
  Project,
  ProjectFile,
  ProjectFileInput,
  ProjectInput,
  ProjectListOptions
} from '../../../shared/types'

interface ProjectRow {
  id: string
  client_id: string
  client_name?: string
  title: string
  description: string
  status: Project['status']
  priority: Project['priority']
  deadline: string | null
  delivered_at: string | null
  quoted_amount: number | null
  currency: Project['currency']
  created_at: string
  updated_at: string
}

function rowToProject(row: ProjectRow): Project {
  return { ...row, quoted_amount: row.quoted_amount ?? null }
}

export function listProjects(options: ProjectListOptions = {}): Project[] {
  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (options.client_id) {
    clauses.push('p.client_id = ?')
    params.push(options.client_id)
  }
  if (options.status) {
    clauses.push('p.status = ?')
    params.push(options.status)
  }
  if (options.includeDone !== true) {
    clauses.push("p.status NOT IN ('delivered', 'cancelled')")
  }
  if (options.q) {
    clauses.push('(p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ?)')
    const like = `%${options.q}%`
    params.push(like, like, like)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
       ${where}
       ORDER BY
         CASE p.status WHEN 'in_progress' THEN 0 WHEN 'review' THEN 1 WHEN 'revision' THEN 2
           WHEN 'enquiry' THEN 3 WHEN 'delivered' THEN 4 ELSE 5 END,
         (p.deadline IS NULL), p.deadline ASC, p.updated_at DESC`
    )
    .all(...params) as ProjectRow[]
  return rows.map(rowToProject)
}

export function getProject(id: string): Project | null {
  const row = getDb()
    .prepare(
      `SELECT p.*, c.name AS client_name FROM projects p
       JOIN clients c ON c.id = p.client_id WHERE p.id = ?`
    )
    .get(id) as ProjectRow | undefined
  return row ? rowToProject(row) : null
}

export function createProject(input: ProjectInput): Project {
  const id = newId()
  const ts = now()
  getDb()
    .prepare(
      `INSERT INTO projects (id, client_id, title, description, status, priority, deadline,
        delivered_at, quoted_amount, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.client_id,
      input.title.trim(),
      input.description?.trim() ?? '',
      input.status ?? 'enquiry',
      input.priority ?? 'normal',
      input.deadline ?? null,
      input.quoted_amount ?? null,
      input.currency ?? 'INR',
      ts,
      ts
    )
  const project = getProject(id)
  if (!project) throw new Error('Failed to create project')
  return project
}

export function updateProject(id: string, input: ProjectInput): Project {
  const db = getDb()
  const existing = getProject(id)
  if (!existing) throw new Error('Project not found')
  db.prepare(
    `UPDATE projects SET client_id = ?, title = ?, description = ?, status = ?, priority = ?,
       deadline = ?, quoted_amount = ?, currency = ?, updated_at = ? WHERE id = ?`
  ).run(
    input.client_id,
    input.title.trim(),
    input.description?.trim() ?? '',
    input.status ?? 'enquiry',
    input.priority ?? 'normal',
    input.deadline ?? null,
    input.quoted_amount ?? null,
    input.currency ?? 'INR',
    now(),
    id
  )
  if ((input.status ?? 'enquiry') === 'delivered' && !existing.delivered_at) {
    db.prepare('UPDATE projects SET delivered_at = ? WHERE id = ?').run(
      new Date().toISOString().slice(0, 10),
      id
    )
  }
  const project = getProject(id)
  if (!project) throw new Error('Project not found')
  return project
}

export function deleteProject(id: string): void {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
}

export function detectFileKind(path: string): FileKind {
  try {
    if (existsSync(path) && statSync(path).isDirectory()) return 'folder'
  } catch {
    /* fall through to extension detection */
  }
  const ext = extname(path).toLowerCase()
  if (ext === '.prproj' || ext === '.prprojx') return 'premiere'
  if (ext === '.aep' || ext === '.aet') return 'after_effects'
  if (ext === '.drp' || ext === '.drx') return 'resolve'
  if (ext === '.fcpxml' || ext === '.fcpxro') return 'final_cut'
  if (ext === '') return 'folder'
  return 'other'
}

export function listProjectFiles(projectId: string): ProjectFile[] {
  return getDb()
    .prepare('SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as ProjectFile[]
}

export function addProjectFile(projectId: string, input: ProjectFileInput): ProjectFile {
  const id = newId()
  const kind = input.kind ?? detectFileKind(input.path)
  const label =
    input.label?.trim() ||
    input.path.split(/[\\/]/).filter(Boolean).pop() ||
    input.path
  getDb()
    .prepare(
      `INSERT INTO project_files (id, project_id, path, label, kind, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, projectId, input.path, label, kind, now())
  const row = getDb().prepare('SELECT * FROM project_files WHERE id = ?').get(id) as ProjectFile
  return row
}

export function removeProjectFile(fileId: string): void {
  getDb().prepare('DELETE FROM project_files WHERE id = ?').run(fileId)
}

export function projectCurrencyAmount(id: string): number | null {
  const row = getDb()
    .prepare('SELECT quoted_amount FROM projects WHERE id = ?')
    .get(id) as { quoted_amount: number | null } | undefined
  return row ? round2(row.quoted_amount ?? 0) : null
}
