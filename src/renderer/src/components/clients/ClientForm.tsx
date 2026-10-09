import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/store/ui'
import { api, type Client, type ClientInput, type Currency } from '@/lib/api'

const COLOR_SWATCHES = ['#BF932A', '#9E6200', '#DFC57B', '#3F6B2F', '#4A5B7A', '#9E2B20']

const emptyForm: ClientInput = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  tags: [],
  color: '#BF932A',
  currency: null
}

interface ClientFormProps {
  open: boolean
  client?: Client | null
  onClose: () => void
  onSaved: (client: Client) => void
}

export function ClientForm({ open, client, onClose, onSaved }: ClientFormProps): ReactNode {
  const [form, setForm] = useState<ClientInput>(emptyForm)
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (client) {
      setForm({
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes,
        tags: client.tags,
        color: client.color,
        currency: client.currency
      })
      setTagsText(client.tags.join(', '))
    } else {
      setForm(emptyForm)
      setTagsText('')
    }
  }, [open, client])

  const set = <K extends keyof ClientInput>(key: K, value: ClientInput[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async (): Promise<void> => {
    if (!form.name.trim()) {
      setError('Client name is required')
      return
    }
    setSaving(true)
    try {
      const payload: ClientInput = {
        ...form,
        name: form.name.trim(),
        tags: tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      }
      const saved = client
        ? await api.clients.update(client.id, payload)
        : await api.clients.create(payload)
      toast.success(client ? 'Client updated' : 'Client added')
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
      title={client ? 'Edit client' : 'New client'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : client ? 'Save changes' : 'Add client'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required className="col-span-2">
          <Input
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Client name"
            autoFocus
          />
        </Field>
        <Field label="Company">
          <Input
            value={form.company}
            onChange={(event) => set('company', event.target.value)}
            placeholder="Studio or company"
          />
        </Field>
        <Field label="Default currency">
          <Select
            value={form.currency ?? ''}
            onChange={(event) =>
              set('currency', (event.target.value || null) as Currency | null)
            }
          >
            <option value="">Use app default</option>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => set('email', event.target.value)}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(event) => set('phone', event.target.value)}
            placeholder="+91 …"
          />
        </Field>
        <Field label="Address" className="col-span-2">
          <Textarea
            rows={2}
            value={form.address}
            onChange={(event) => set('address', event.target.value)}
            placeholder="Billing address"
          />
        </Field>
        <Field label="Tags" hint="Comma separated" className="col-span-2">
          <Input
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            placeholder="wedding, retainer, agency"
          />
        </Field>
        <Field label="Color" className="col-span-2">
          <div className="flex gap-2">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => set('color', color)}
                className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                  form.color === color
                    ? 'scale-110 border-ink'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ background: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </Field>
        <Field label="Notes" className="col-span-2">
          <Textarea
            rows={3}
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            placeholder="Preferences, rates, anything useful"
          />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  )
}
