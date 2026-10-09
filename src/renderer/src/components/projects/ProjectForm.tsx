import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/store/ui'
import {
  api,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type Client,
  type Currency,
  type Priority,
  type Project,
  type ProjectInput,
  type ProjectStatus
} from '@/lib/api'

const emptyForm: ProjectInput = {
  client_id: '',
  title: '',
  description: '',
  status: 'enquiry',
  priority: 'normal',
  deadline: null,
  quoted_amount: null,
  currency: 'INR'
}

interface ProjectFormProps {
  open: boolean
  project?: Project | null
  defaultClientId?: string
  onClose: () => void
  onSaved: (project: Project) => void
}

export function ProjectForm({
  open,
  project,
  defaultClientId,
  onClose,
  onSaved
}: ProjectFormProps): ReactNode {
  const [form, setForm] = useState<ProjectInput>(emptyForm)
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (project) {
      setForm({
        client_id: project.client_id,
        title: project.title,
        description: project.description,
        status: project.status,
        priority: project.priority,
        deadline: project.deadline,
        quoted_amount: project.quoted_amount,
        currency: project.currency
      })
    } else {
      setForm({ ...emptyForm, client_id: defaultClientId ?? '' })
    }
    api.clients
      .list()
      .then(setClients)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))
  }, [open, project, defaultClientId])

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async (): Promise<void> => {
    if (!form.client_id) {
      setError('Choose a client')
      return
    }
    if (!form.title.trim()) {
      setError('Project title is required')
      return
    }
    setSaving(true)
    try {
      const payload: ProjectInput = { ...form, title: form.title.trim() }
      const saved = project
        ? await api.projects.update(project.id, payload)
        : await api.projects.create(payload)
      toast.success(project ? 'Project updated' : 'Project created')
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={project ? 'Edit project' : 'New project'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Client" required>
          <Select
            value={form.client_id}
            onChange={(event) => set('client_id', event.target.value)}
          >
            <option value="">Select client…</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.company ? ` — ${client.company}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="Wedding highlight film"
            autoFocus
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(event) => set('status', event.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select
            value={form.priority}
            onChange={(event) => set('priority', event.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="Deadline">
          <Input
            type="date"
            value={form.deadline ?? ''}
            onChange={(event) => set('deadline', event.target.value || null)}
          />
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <Field label="Quoted amount">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.quoted_amount ?? ''}
              onChange={(event) =>
                set('quoted_amount', event.target.value === '' ? null : Number(event.target.value))
              }
              placeholder="0.00"
            />
          </Field>
          <Field label="Currency">
            <Select
              value={form.currency}
              onChange={(event) => set('currency', event.target.value as Currency)}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </Select>
          </Field>
        </div>
        <Field label="Description" className="col-span-2">
          <Textarea
            rows={4}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="Scope, deliverables, notes…"
          />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  )
}
