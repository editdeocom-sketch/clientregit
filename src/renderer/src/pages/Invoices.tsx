import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { EmptyState, PageHeader } from '@/components/ui/Layout'
import {
  api,
  fmtDate,
  invoiceTone,
  isOverdue,
  money,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABEL,
  type Invoice,
  type InvoiceStatus
} from '@/lib/api'
import { useApi, useDebounced } from '@/lib/hooks'
import { toast } from '@/store/ui'

export function Invoices(): ReactNode {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const debounced = useDebounced(query)

  const { data: invoices, loading, reload } = useApi<Invoice[]>(
    () =>
      api.invoices.list({
        q: debounced || undefined,
        status: status === 'all' ? undefined : status
      }),
    [debounced, status]
  )

  const previewInvoice = async (invoice: Invoice): Promise<void> => {
    try {
      await api.invoices.preview(invoice.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const printPdf = async (invoice: Invoice): Promise<void> => {
    try {
      const result = await api.invoices.print(invoice.id, 'pdf')
      if (result.path) toast.success(`PDF saved to ${result.path}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    try {
      await api.invoices.remove(deleteTarget.id)
      toast.success('Invoice deleted')
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Billing and payments"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={15} />}
            onClick={() => navigate('/invoices/new')}
          >
            New invoice
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-72">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <Icon name="search" size={15} />
          </span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search number, client…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['all', ...INVOICE_STATUSES] as Array<InvoiceStatus | 'all'>).map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              status === item
                ? 'border-gold bg-gold text-white'
                : 'border-line bg-surface text-muted hover:border-gold hover:text-ink'
            }`}
          >
            {item === 'all' ? 'All' : INVOICE_STATUS_LABEL[item]}
          </button>
        ))}
      </div>

      {loading && !invoices ? (
        <div className="py-16 text-center text-sm text-muted">Loading invoices…</div>
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No invoices"
          message="Create an invoice with line items, tax and payments tracking."
          action={
            <Button variant="primary" onClick={() => navigate('/invoices/new')}>
              New invoice
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Number</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Issued</th>
                <th className="px-5 py-3 font-semibold">Due</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-right font-semibold">Balance</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2 cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-medium">{invoice.invoice_number}</td>
                  <td className="px-5 py-3.5 text-muted">{invoice.client_name}</td>
                  <td className="px-5 py-3.5 text-muted">{fmtDate(invoice.issue_date)}</td>
                  <td className="px-5 py-3.5">
                    {invoice.due_date ? (
                      <span className={isOverdue(invoice.due_date) && invoice.balance > 0 ? 'font-semibold text-danger' : 'text-muted'}>
                        {fmtDate(invoice.due_date)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">
                    {money(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-muted">
                    {money(invoice.balance, invoice.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Icon name="eye" size={14} />}
                        onClick={(event) => {
                          event.stopPropagation()
                          void previewInvoice(invoice)
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Icon name="printer" size={14} />}
                        onClick={(event) => {
                          event.stopPropagation()
                          void printPdf(invoice)
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Icon name="trash" size={14} />}
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleteTarget(invoice)
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete invoice?"
        message={`Invoice ${deleteTarget?.invoice_number ?? ''} and its payments will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
