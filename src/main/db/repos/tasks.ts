import { getDb, newId, now } from '../database'
import { markTombstone } from '../tombstones'
import type { Task, TaskInput, TaskPatch } from '../../../shared/types'

interface TaskRow {
  id: string
  project_id: string
  title: string
  done: number
  due_date: string | null
  position: number
  assignee_id: string | null
  created_at: string
  updated_at: string
}

function rowToTask(row: TaskRow): Task {
  return { ...row, done: row.done === 1 }
}

export function listTasks(projectId: string): Task[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM tasks WHERE project_id = ?
       ORDER BY done ASC, (due_date IS NULL), due_date ASC, position ASC, created_at ASC`
    )
    .all(projectId) as TaskRow[]
  return rows.map(rowToTask)
}

export function createTask(projectId: string, input: TaskInput): Task {
  const db = getDb()
  const title = input.title.trim()
  if (!title) throw new Error('Task title is required')
  const maxRow = db
    .prepare('SELECT IFNULL(MAX(position), -1) AS p FROM tasks WHERE project_id = ?')
    .get(projectId) as { p: number }
  const id = newId()
  const ts = now()
  db.prepare(
    `INSERT INTO tasks (id, project_id, title, done, due_date, assignee_id, position, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)`
  ).run(
    id,
    projectId,
    title,
    input.due_date ?? null,
    input.assignee_id ?? null,
    maxRow.p + 1,
    ts,
    ts
  )
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow
  return rowToTask(row)
}

export function updateTask(id: string, patch: TaskPatch): Task {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
  if (!existing) throw new Error('Task not found')
  db.prepare(
    'UPDATE tasks SET title = ?, done = ?, due_date = ?, assignee_id = ?, updated_at = ? WHERE id = ?'
  ).run(
    patch.title !== undefined ? patch.title.trim() : existing.title,
    patch.done !== undefined ? (patch.done ? 1 : 0) : existing.done,
    patch.due_date !== undefined ? patch.due_date : existing.due_date,
    patch.assignee_id !== undefined ? patch.assignee_id : existing.assignee_id,
    now(),
    id
  )
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow
  return rowToTask(row)
}

export function deleteTask(id: string): void {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)
  markTombstone('tasks', id)
}
