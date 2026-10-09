import { BrowserWindow, dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import { getInvoice } from '../db/repos/invoices'
import { getClient } from '../db/repos/clients'
import { getSettings } from '../db/repos/settings'
import type { AppSettings, Client, Currency, ExportResult, Invoice, InvoicePrintFormat } from '../../shared/types'

function money(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount)
}

function displayDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br>')
}

function renderInvoiceHtml(invoice: Invoice, settings: AppSettings, client: Client | null): string {
  const businessName = settings.business_name || ''
  const accent = '#BF932A'
  const border = '#ECDCAB'
  const paper = '#FCFCF7'
  const ink = '#3E3112'
  const muted = '#8A7A52'

  const itemRows = invoice.items
    .map(
      (item, index) => `
      <tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${money(item.rate, invoice.currency)}</td>
        <td class="num">${money(item.amount, invoice.currency)}</td>
      </tr>`
    )
    .join('')

  const paymentRows = invoice.payments
    .map(
      (payment) => `
      <tr>
        <td>${displayDate(payment.paid_at)}</td>
        <td>${escapeHtml(payment.method || '—')}</td>
        <td>${escapeHtml(payment.reference || '—')}</td>
        <td class="num">${money(payment.amount, invoice.currency)}</td>
      </tr>`
    )
    .join('')

  const clientBlock = client
    ? `
      <div class="label">Billed to</div>
      <div class="strong">${escapeHtml(client.name)}</div>
      ${client.company ? `<div>${escapeHtml(client.company)}</div>` : ''}
      ${client.address ? `<div class="muted">${nl2br(client.address)}</div>` : ''}
      ${client.email ? `<div class="muted">${escapeHtml(client.email)}</div>` : ''}
      ${client.phone ? `<div class="muted">${escapeHtml(client.phone)}</div>` : ''}`
    : '<div class="label">Billed to</div><div class="muted">—</div>'

  const totalsRows = [
    `<div class="row"><span>Subtotal</span><span>${money(invoice.subtotal, invoice.currency)}</span></div>`,
    invoice.discount > 0
      ? `<div class="row"><span>Discount</span><span>-${money(invoice.discount, invoice.currency)}</span></div>`
      : '',
    invoice.tax_percent > 0
      ? `<div class="row"><span>Tax (${invoice.tax_percent}%)</span><span>${money(invoice.tax_amount, invoice.currency)}</span></div>`
      : '',
    `<div class="row total"><span>Total</span><span>${money(invoice.total, invoice.currency)}</span></div>`,
    invoice.amount_paid > 0
      ? `<div class="row paid"><span>Paid</span><span>-${money(invoice.amount_paid, invoice.currency)}</span></div>`
      : '',
    invoice.amount_paid > 0
      ? `<div class="row balance"><span>Balance due</span><span>${money(invoice.balance, invoice.currency)}</span></div>`
      : ''
  ].join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(invoice.invoice_number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: ${ink}; background: #ffffff; font-size: 13px; line-height: 1.5;
  }
  .sheet { max-width: 760px; margin: 0 auto; background: ${paper}; border: 1px solid ${border}; padding: 40px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .brand h1 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
  .brand .tag { color: ${muted}; font-size: 12px; margin-top: 4px; }
  .brand .contact { color: ${muted}; font-size: 12px; margin-top: 10px; }
  .meta { text-align: right; }
  .meta .title { font-size: 26px; font-weight: 700; color: ${accent}; letter-spacing: 0.08em; }
  .meta .number { font-weight: 600; margin-top: 4px; }
  .meta .dates { color: ${muted}; font-size: 12px; margin-top: 8px; }
  .rule { height: 3px; background: ${accent}; margin: 24px 0; border-radius: 2px; }
  .cols { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 28px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${accent}; font-weight: 700; margin-bottom: 6px; }
  .strong { font-weight: 600; }
  .muted { color: ${muted}; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${muted}; border-bottom: 2px solid ${border}; padding: 8px 10px; }
  td { padding: 9px 10px; border-bottom: 1px solid ${border}; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  tbody tr:nth-child(even) { background: rgba(236, 220, 171, 0.25); }
  .bottom { display: flex; justify-content: space-between; gap: 32px; margin-top: 26px; }
  .notes { flex: 1; font-size: 12px; color: ${muted}; }
  .totals { width: 260px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 10px; font-size: 13px; }
  .totals .row.total { background: ${accent}; color: #ffffff; font-weight: 700; font-size: 15px; margin-top: 6px; padding: 10px; }
  .totals .row.paid { color: ${muted}; }
  .totals .row.balance { font-weight: 700; border-top: 2px solid ${border}; }
  .payments { margin-top: 28px; }
  .foot { margin-top: 34px; padding-top: 14px; border-top: 1px solid ${border}; font-size: 11px; color: ${muted}; display: flex; justify-content: center; text-align: center; letter-spacing: 0.08em; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        ${businessName ? `<h1>${escapeHtml(businessName)}</h1>` : ''}
        ${settings.business_tagline ? `<div class="tag">${escapeHtml(settings.business_tagline)}</div>` : ''}
        <div class="contact">
          ${[settings.business_address, settings.business_phone, settings.business_email, settings.business_tax_id]
            .filter(Boolean)
            .map(escapeHtml)
            .join('<br>')}
        </div>
      </div>
      <div class="meta">
        <div class="title">INVOICE</div>
        <div class="number">${escapeHtml(invoice.invoice_number)}</div>
        <div class="dates">
          Issued: ${displayDate(invoice.issue_date)}<br>
          Due: ${displayDate(invoice.due_date)}
        </div>
      </div>
    </div>

    <div class="rule"></div>

    <div class="cols">
      <div>${clientBlock}</div>
      <div style="text-align:right">
        <div class="label">Project</div>
        <div class="strong">${invoice.project_title ? escapeHtml(invoice.project_title) : '—'}</div>
        <div class="label" style="margin-top:14px">Currency</div>
        <div class="strong">${invoice.currency}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="num" style="width:40px">#</th>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Rate</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="bottom">
      <div class="notes">
        ${invoice.notes ? `<div class="label">Notes</div>${nl2br(invoice.notes)}` : ''}
        ${settings.invoice_terms ? `<div style="margin-top:14px">${nl2br(settings.invoice_terms)}</div>` : ''}
      </div>
      <div class="totals">${totalsRows}</div>
    </div>

    ${
      invoice.payments.length > 0
        ? `<div class="payments">
            <div class="label">Payment history</div>
            <table>
              <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th class="num">Amount</th></tr></thead>
              <tbody>${paymentRows}</tbody>
            </table>
          </div>`
        : ''
    }

    <div class="foot">
      <span>Auto Generated Invoice</span>
    </div>
  </div>
</body>
</html>`
}

async function loadInvoiceWindow(html: string): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: { sandbox: true, contextIsolation: true }
  })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  return win
}

export async function previewInvoice(id: string): Promise<void> {
  const invoice = getInvoice(id)
  if (!invoice) throw new Error('Invoice not found')
  const settings = getSettings()
  const client = getClient(invoice.client_id)
  const html = renderInvoiceHtml(invoice, settings, client)

  const win = new BrowserWindow({
    show: false,
    width: 960,
    height: 1100,
    minWidth: 700,
    minHeight: 600,
    autoHideMenuBar: true,
    title: `Preview — ${invoice.invoice_number}`,
    webPreferences: { sandbox: true, contextIsolation: true }
  })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  win.show()
}

export async function printInvoice(
  id: string,
  format: InvoicePrintFormat
): Promise<ExportResult> {
  const invoice = getInvoice(id)
  if (!invoice) throw new Error('Invoice not found')
  const settings = getSettings()
  const client = getClient(invoice.client_id)
  const html = renderInvoiceHtml(invoice, settings, client)
  const win = await loadInvoiceWindow(html)

  try {
    if (format === 'pdf') {
      const data = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4'
      })
      const result = await dialog.showSaveDialog({
        title: 'Save invoice PDF',
        defaultPath: `${invoice.invoice_number}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (result.canceled || !result.filePath) return { path: null }
      await writeFile(result.filePath, data)
      return { path: result.filePath }
    }

    await new Promise<void>((resolve) => {
      win.webContents.print(
        { silent: false, printBackground: true, pageSize: 'A4' },
        () => resolve()
      )
    })
    return { path: null }
  } finally {
    if (!win.isDestroyed()) win.destroy()
  }
}
