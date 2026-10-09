import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Icon } from '@/components/ui/Icon'
import {
  api,
  fmtDate,
  invoiceTone,
  money,
  INVOICE_STATUS_LABEL,
  type Client,
  type Currency,
  type Invoice,
  type InvoiceInput,
  type InvoiceStatus,
  type Project
} from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast } from '@/store/ui'

interface ItemDraft {
  description: string
  quantity: number
  rate: number
}

interface FormData {
  client_id: string
  project_id: string
  issue_date: string
  due_date: string
  currency: Currency
  tax_percent: number
  discount: number
  notes: string
  status: InvoiceStatus
  items: ItemDraft[]
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function addDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function InvoiceEditor(): ReactNode {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = !!id

  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(addDays(0))
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer')
  const [paymentRef, setPaymentRef] = useState('')

  const { data, loading, reload } = useApi<{
    invoice: Invoice | null
    clients: Client[]
    projects: Project[]
  }>(async () => {
    const [invoice, clients, projects] = await Promise.all([
      isEdit ? api.invoices.get(id) : Promise.resolve(null),
      api.clients.list(),
      api.projects.list({ includeDone: true })
    ])
    return { invoice, clients, projects }
  }, [id, isEdit])

  const settings = useApi(() => api.settings.get(), [])

  useEffect(() => {
    if (!data || form) return
    if (data.invoice) {
      const invoice = data.invoice
      setForm({
        client_id: invoice.client_id,
        project_id: invoice.project_id ?? '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date ?? '',
        currency: invoice.currency,
        tax_percent: invoice.tax_percent,
        discount: invoice.discount,
        notes: invoice.notes,
        status: invoice.status,
        items:
          invoice.items.length > 0
            ? invoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                rate: item.rate
              }))
            : [{ description: '', quantity: 1, rate: 0 }]
      })
    } else if (settings.data) {
      const clientParam = searchParams.get('client') ?? ''
      const projectParam = searchParams.get('project') ?? ''
      const client = data.clients.find((client) => client.id === clientParam)
      setForm({
        client_id: clientParam,
        project_id: projectParam,
        issue_date: addDays(0),
        due_date: addDays(14),
        currency: client?.currency ?? settings.data.currency,
        tax_percent: settings.data.tax_percent,
        discount: 0,
        notes: '',
        status: 'draft',
        items: [{ description: '', quantity: 1, rate: 0 }]
      })
    }
  }, [data, settings.data, form, searchParams])

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, discount: 0, tax: 0, total: 0 }
    const subtotal = round2(
      form.items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
    )
    const discount = round2(Math.min(Math.max(form.discount, 0), subtotal))
    const taxable = round2(subtotal - discount)
    const tax = round2((taxable * form.tax_percent) / 100)
    return { subtotal, discount, tax, total: round2(taxable + tax) }
  }, [form])

  const clientProjects = useMemo(
    () => (form ? (data?.projects.filter((project) => project.client_id === form.client_id) ?? []) : []),
    [form, data]
  )

  const save = async (): Promise<void> => {
    if (!form) return
    if (!form.client_id) return setError('Choose a client')
    if (!form.items.some((item) => item.description.trim()))
      return setError('Add at least one line item with a description')
    setSaving(true)
    setError('')
    try {
      const payload: InvoiceInput = {
        client_id: form.client_id,
        project_id: form.project_id || null,
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        status: form.status,
        currency: form.currency,
        tax_percent: form.tax_percent,
        discount: form.discount,
        notes: form.notes,
        items: form.items
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate
          }))
      }
      if (isEdit) {
        await api.invoices.update(id, payload)
        toast.success('Invoice updated')
        reload()
      } else {
        const created = await api.invoices.create(payload)
        toast.success('Invoice created')
        navigate(`/invoices/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const setItem = (index: number, patch: Partial<ItemDraft>): void => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
          }
        : prev
    )
  }

  const addPayment = async (): Promise<void> => {
    if (!form || !data?.invoice) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return toast.error('Enter a valid payment amount')
    try {
      await api.invoices.addPayment(data.invoice.id, {
        amount,
        paid_at: paymentDate,
        method: paymentMethod,
        reference: paymentRef
      })
      toast.success('Payment recorded')
      setPaymentAmount('')
      setPaymentRef('')
      reload()
      settings.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const previewInvoice = async (): Promise<void> => {
    if (!data?.invoice) return
    try {
      await api.invoices.preview(data.invoice.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const printInvoice = async (format: 'print' | 'pdf'): Promise<void> => {
    if (!data?.invoice) return
    try {
      const result = await api.invoices.print(data.invoice.id, format)
      if (format === 'pdf' && result.path) toast.success(`PDF saved to ${result.path}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading || !form || !data) {
    return <div className="py-20 text-center text-sm text-muted">Loading invoice…</div>
  }

  const invoice = data.invoice

  return (
    <div>
      <Link to="/invoices" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow-left" size={15} />
        Invoices
      </Link>

      <PageHeader
        title={invoice ? `Invoice ${invoice.invoice_number}` : 'New invoice'}
        subtitle={invoice ? `Issued ${fmtDate(invoice.issue_date)}` : 'Bill your client in a few clicks'}
        actions={
          invoice && (
            <>
              <Button variant="secondary" icon={<Icon name="trash" size={15} />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
              <Button variant="secondary" icon={<Icon name="eye" size={15} />} onClick={() => void previewInvoice()}>
                Preview
              </Button>
              <Button variant="secondary" icon={<Icon name="printer" size={15} />} onClick={() => printInvoice('print')}>
                Print
              </Button>
              <Button variant="primary" icon={<Icon name="download" size={15} />} onClick={() => printInvoice('pdf')}>
                Save PDF
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Invoice details"
              action={invoice && <Badge tone={invoiceTone[invoice.status]}>{INVOICE_STATUS_LABEL[invoice.status]}</Badge>}
            />
            <div className="grid grid-cols-2 gap-4 px-5 py-4">
              <Field label="Client" required>
                <Select
                  value={form.client_id}
                  onChange={(event) =>
                    setForm({ ...form, client_id: event.target.value, project_id: '' })
                  }
                >
                  <option value="">Select client…</option>
                  {data.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.company ? ` — ${client.company}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Project">
                <Select
                  value={form.project_id}
                  onChange={(event) => setForm({ ...form, project_id: event.target.value })}
                  disabled={!form.client_id}
                >
                  <option value="">No linked project</option>
                  {clientProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Issue date">
                <Input
                  type="date"
                  value={form.issue_date}
                  onChange={(event) => setForm({ ...form, issue_date: event.target.value })}
                />
              </Field>
              <Field label="Due date">
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => setForm({ ...form, due_date: event.target.value })}
                />
              </Field>
              {isEdit && (
                <Field label="Status">
                  <Select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as InvoiceStatus })
                    }
                  >
                    {(['draft', 'sent', 'partial', 'paid', 'cancelled'] as InvoiceStatus[]).map(
                      (status) => (
                        <option key={status} value={status}>
                          {INVOICE_STATUS_LABEL[status]}
                        </option>
                      )
                    )}
                  </Select>
                </Field>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Line items"
              action={
                <Button
                  size="sm"
                  icon={<Icon name="plus" size={14} />}
                  onClick={() =>
                    setForm({
                      ...form,
                      items: [...form.items, { description: '', quantity: 1, rate: 0 }]
                    })
                  }
                >
                  Add item
                </Button>
              }
            />
            <div className="px-5 py-4">
              <div className="mb-2 grid grid-cols-[1fr_80px_120px_120px_36px] gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_80px_120px_120px_36px] items-center gap-2">
                    <Input
                      value={item.description}
                      onChange={(event) => setItem(index, { description: event.target.value })}
                      placeholder="Highlight film edit"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.quantity}
                      onChange={(event) => setItem(index, { quantity: Number(event.target.value) })}
                      className="text-right"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(event) => setItem(index, { rate: Number(event.target.value) })}
                      className="text-right"
                    />
                    <div className="text-right text-sm font-medium">
                      {money(round2(item.quantity * item.rate), form.currency)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Icon name="x" size={14} />}
                      onClick={() =>
                        setForm({
                          ...form,
                          items:
                            form.items.length > 1
                              ? form.items.filter((_, i) => i !== index)
                              : form.items
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <div className="px-5 py-4">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Payment instructions, thank you note…"
              />
            </div>
          </Card>

          {invoice && (
            <Card>
              <CardHeader
                title="Payments"
                subtitle={`${money(invoice.amount_paid, invoice.currency)} received of ${money(invoice.total, invoice.currency)}`}
              />
              <div className="px-5 py-4">
                {invoice.payments.length > 0 && (
                  <div className="mb-4 divide-y divide-line/60 rounded-lg border border-line">
                    {invoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <Icon name="card" size={15} className="text-muted" />
                        <span className="font-medium">{money(payment.amount, invoice.currency)}</span>
                        <span className="text-muted">{fmtDate(payment.paid_at)}</span>
                        <span className="text-xs text-muted">{payment.method}</span>
                        {payment.reference && <span className="text-xs text-muted">#{payment.reference}</span>}
                        <span className="flex-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Icon name="trash" size={14} />}
                          onClick={() =>
                            void api.invoices
                              .removePayment(payment.id)
                              .then(() => {
                                toast.success('Payment removed')
                                reload()
                              })
                              .catch((err: unknown) =>
                                toast.error(err instanceof Error ? err.message : String(err))
                              )
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Amount" className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder={String(invoice.balance)}
                    />
                  </Field>
                  <Field label="Date" className="w-40">
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(event) => setPaymentDate(event.target.value)}
                    />
                  </Field>
                  <Field label="Method" className="w-44">
                    <Select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                      <option>Bank transfer</option>
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>Other</option>
                    </Select>
                  </Field>
                  <Field label="Reference" className="flex-1">
                    <Input
                      value={paymentRef}
                      onChange={(event) => setPaymentRef(event.target.value)}
                      placeholder="UTR / transaction id"
                    />
                  </Field>
                  <Button variant="primary" onClick={addPayment}>
                    Add payment
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Totals" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <Field label="Currency">
                <Select
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value as Currency })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tax %">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.tax_percent}
                    onChange={(event) => setForm({ ...form, tax_percent: Number(event.target.value) })}
                    className="text-right"
                  />
                </Field>
                <Field label="Discount">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(event) => setForm({ ...form, discount: Number(event.target.value) })}
                    className="text-right"
                  />
                </Field>
              </div>
              <div className="space-y-2 border-t border-line pt-3">
                <Row label="Subtotal" value={money(totals.subtotal, form.currency)} />
                <Row label="Discount" value={`-${money(totals.discount, form.currency)}`} />
                <Row label={`Tax (${form.tax_percent}%)`} value={money(totals.tax, form.currency)} />
                <div className="flex items-center justify-between rounded-lg bg-gold px-3 py-2.5 text-white">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold">{money(totals.total, form.currency)}</span>
                </div>
                {invoice && invoice.amount_paid > 0 && (
                  <>
                    <Row label="Paid" value={`-${money(invoice.amount_paid, invoice.currency)}`} />
                    <Row label="Balance" value={money(invoice.balance, invoice.currency)} strong />
                  </>
                )}
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button variant="primary" className="w-full" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create invoice'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/invoices')}>
                Cancel
              </Button>
            </div>
          </Card>

          {invoice && (
            <Card>
              <CardHeader title="Activity" />
              <div className="space-y-2 px-5 py-4 text-xs text-muted">
                <p>Created {fmtDate(invoice.created_at)}</p>
                <p>Last updated {fmtDate(invoice.updated_at)}</p>
                {invoice.project_title && <p>Linked to {invoice.project_title}</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete invoice?"
        message={`Invoice ${invoice?.invoice_number ?? ''} and its payments will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void api.invoices
            .remove(invoice!.id)
            .then(() => {
              toast.success('Invoice deleted')
              navigate('/invoices')
            })
            .catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))
        }}
      />
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }): ReactNode {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-bold' : 'font-medium'}>{value}</span>
    </div>
  )
}
