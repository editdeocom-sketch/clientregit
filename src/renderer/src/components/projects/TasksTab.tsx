import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Field'
import { api, fmtDate, isOverdue, type Task } from '@/lib/api'
import { toast } from '@/store/ui'

export function TasksTab({ projectId }: { projectId: string }): ReactNode {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api.tasks
      .list(projectId)
      .then(setTasks)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))
  }, [projectId])

  useEffect(() => {
    setTasks(null)
    load()
  }, [load])

  const add = async (): Promise<void> => {
    if (!title.trim()) return
    setBusy(true)
    try {
      await api.tasks.create(projectId, { title, due_date: dueDate || null })
      setTitle('')
      setDueDate('')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (task: Task): Promise<void> => {
    try {
      await api.tasks.update(task.id, { done: !task.done })
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const remove = async (task: Task): Promise<void> => {
    try {
      await api.tasks.remove(task.id)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const doneCount = (tasks ?? []).filter((task) => task.done).length
  const total = (tasks ?? []).length
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Tasks</h3>
            <p className="mt-0.5 text-xs text-muted">
              {total === 0
                ? 'Break the job into steps — shoot, edit, review, deliver'
                : `${doneCount} of ${total} done`}
            </p>
          </div>
          {total > 0 && (
            <span className="text-sm font-semibold text-gold">{progress}%</span>
          )}
        </div>
        {total > 0 && (
          <div className="h-2 rounded-full bg-surface-2">
            <div
              className="h-2 rounded-full bg-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add()
          }}
          placeholder="Add a task… e.g. Colour grade part 2"
          className="min-w-56 flex-1"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="w-40"
        />
        <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={add} disabled={busy}>
          Add
        </Button>
      </div>

      <div className="divide-y divide-line/60">
        {tasks === null ? (
          <div className="px-5 py-8 text-center text-sm text-muted">Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            No tasks yet. Add the first step above.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="group flex items-center gap-3 px-5 py-3">
              <button
                onClick={() => void toggle(task)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
                  task.done
                    ? 'border-gold bg-gold text-white'
                    : 'border-line bg-surface hover:border-gold'
                }`}
                aria-label={task.done ? 'Mark not done' : 'Mark done'}
              >
                {task.done && <Icon name="check" size={13} />}
              </button>
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${
                    task.done ? 'text-muted line-through' : 'text-ink'
                  }`}
                >
                  {task.title}
                </span>
              </div>
              {task.due_date && (
                <span
                  className={`text-xs ${
                    !task.done && isOverdue(task.due_date)
                      ? 'font-semibold text-danger'
                      : 'text-muted'
                  }`}
                >
                  {fmtDate(task.due_date)}
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                icon={<Icon name="trash" size={14} />}
                onClick={() => void remove(task)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
