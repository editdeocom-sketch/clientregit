import { useEffect, useState, useCallback } from "react"
import QRCode from "qrcode"
import { jsPDF } from "jspdf"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/services/api"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { FileText, Plus, Trash2, Pencil, Eye, Share2, Mail, Phone, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { usePreferences } from "@/contexts/PreferencesContext"
import { useSearchParams } from "react-router-dom"

interface ClientOption {
  id: string
  name: string
}

interface InvoiceData {
  id: string
  invoiceNumber: string
  client: string
  clientId: string
  description: string | null
  amount: number
  issueDate: string
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  editorName?: string
  editorEmail?: string
  clientEmail?: string
  clientPhone?: string
  clientCompany?: string
  clientAddress?: string
  clientCity?: string
  clientState?: string
  clientCountry?: string
  clientWebsite?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-0" },
  sent: { label: "Sent", className: "bg-blue-500/20 text-blue-400 border-0" },
  paid: { label: "Paid", className: "bg-green-500/20 text-green-400 border-0" },
  overdue: { label: "Overdue", className: "bg-red-500/20 text-red-400 border-0" },
}

const emptyForm = {
  clientId: "",
  description: "",
  amount: "",
  issueDate: "",
  dueDate: "",
  status: "draft" as InvoiceData["status"],
}

function InvoiceQRCode({ invoiceId }: { invoiceId: string }) {
  const [code, setCode] = useState("")

  useEffect(() => {
    const url = `${window.location.origin}/invoices?invoice=${invoiceId}`
    QRCode.toDataURL(url, { width: 180, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0B132B", light: "#FFFFFF" } })
      .then(setCode)
      .catch(() => setCode(""))
  }, [invoiceId])

  if (!code) return <div className="h-[180px] w-[180px] rounded-lg bg-muted animate-pulse" />
  return <img src={code} alt="QR code for this invoice" className="h-[180px] w-[180px] rounded-lg border border-border bg-white p-2" />
}

function createInvoicePdf(invoice: InvoiceData, formatAmount: (amount: number) => string): Blob {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  pdf.setTextColor(11, 19, 43)
  pdf.setFontSize(20)
  pdf.text("ClientRegit", 20, 25)
  pdf.setFontSize(16)
  pdf.text(`Invoice ${invoice.invoiceNumber}`, pageWidth - 20, 25, { align: "right" })
  pdf.setDrawColor(58, 80, 107)
  pdf.line(20, 32, pageWidth - 20, 32)

  pdf.setFontSize(10)
  pdf.setTextColor(100, 116, 139)
  pdf.text("FROM", 20, 48)
  pdf.setTextColor(11, 19, 43)
  pdf.setFontSize(12)
  pdf.text(invoice.editorName || "Editor", 20, 56)
  pdf.setFontSize(10)
  pdf.text(invoice.editorEmail || "", 20, 63)

  pdf.setTextColor(100, 116, 139)
  pdf.text("BILL TO", pageWidth / 2, 48)
  pdf.setTextColor(11, 19, 43)
  pdf.setFontSize(12)
  pdf.text(invoice.client || "Client", pageWidth / 2, 56)
  pdf.setFontSize(10)
  pdf.text(invoice.clientEmail || "", pageWidth / 2, 63)
  pdf.text(invoice.clientPhone || "", pageWidth / 2, 70)

  pdf.setFillColor(241, 245, 249)
  pdf.rect(20, 85, pageWidth - 40, 12, "F")
  pdf.setTextColor(100, 116, 139)
  pdf.text("DESCRIPTION", 25, 93)
  pdf.text("AMOUNT", pageWidth - 25, 93, { align: "right" })
  pdf.setTextColor(11, 19, 43)
  pdf.text(invoice.description || "Professional creative services", 25, 112)
  pdf.text(formatAmount(invoice.amount), pageWidth - 25, 112, { align: "right" })
  pdf.line(20, 120, pageWidth - 20, 120)
  pdf.setFontSize(14)
  pdf.text("Total", pageWidth - 75, 140)
  pdf.text(formatAmount(invoice.amount), pageWidth - 25, 140, { align: "right" })
  pdf.setFontSize(10)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Issue date: ${invoice.issueDate || "-"}`, 20, 140)
  pdf.text(`Due date: ${invoice.dueDate || "-"}`, 20, 148)
  pdf.text(`Status: ${invoice.status}`, 20, 156)
  pdf.setTextColor(58, 80, 107)
  pdf.text("Thank you for your business.", 20, 180)
  return pdf.output("blob")
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const { formatAmount, fromBaseAmount, toBaseAmount, preferences } = usePreferences()
  const [searchParams] = useSearchParams()
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceData | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null)
  const [sentInvoice, setSentInvoice] = useState<InvoiceData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({})

  const loadClients = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: ClientOption[] }>("/clients")
      if (res.success) setClients(res.data)
    } catch {
      setClients([])
    }
  }, [])

  const loadInvoices = useCallback(async () => {
    try {
      if (!user) return
      const res = await api.get<{ success: boolean; data: InvoiceData[] }>("/invoices")
      if (res.success) {
        setInvoices(
          res.data.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            client: inv.client_name ?? "Unknown",
            clientId: inv.client_id,
            description: inv.description,
            amount: inv.amount,
            issueDate: inv.issue_date,
            dueDate: inv.due_date,
            status: inv.status,
            editorName: inv.editor_name,
            editorEmail: inv.editor_email,
            clientEmail: inv.client_email,
            clientPhone: inv.client_phone,
            clientCompany: inv.client_company,
            clientAddress: inv.client_address,
            clientCity: inv.client_city,
            clientState: inv.client_state,
            clientCountry: inv.client_country,
            clientWebsite: inv.client_website,
          }))
        )
      }
    } catch {
      setInvoices([])
    }
  }, [user])

  useEffect(() => {
    loadInvoices()
    loadClients()
  }, [loadInvoices, loadClients])

  useEffect(() => {
    const invoiceId = searchParams.get("invoice")
    if (invoiceId) {
      const invoice = invoices.find((item) => item.id === invoiceId)
      if (invoice) setPreviewInvoice(invoice)
    }
  }, [invoices, searchParams])

  const openCreateDialog = () => {
    setEditingInvoice(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (invoice: InvoiceData) => {
    setEditingInvoice(invoice)
    setForm({
      clientId: invoice.clientId,
      description: invoice.description || "",
      amount: String(fromBaseAmount(invoice.amount)),
      issueDate: invoice.issueDate || "",
      dueDate: invoice.dueDate || "",
      status: invoice.status,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (!user) {
        toast.error("You must be logged in.")
        return
      }

      if (!form.clientId) {
        toast.error("Please select a client.")
        return
      }

      const today = new Date().toISOString().split("T")[0]

      const payload = {
        client_id: form.clientId,
        description: form.description || undefined,
        amount: toBaseAmount(Number(form.amount)),
        issue_date: form.issueDate || today,
        due_date: form.dueDate,
        status: form.status,
      }
      const res = editingInvoice
        ? await api.put<{ success: boolean; data: InvoiceData }>(`/invoices/${editingInvoice.id}`, payload)
        : await api.post<{ success: boolean; data: InvoiceData }>("/invoices", payload)

      if (!res.success) throw new Error("Failed to create invoice.")

      toast.success(editingInvoice ? "Invoice updated successfully." : "Invoice created successfully.")
      setDialogOpen(false)
      setForm(emptyForm)
      await loadInvoices()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create invoice."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id: string, status: InvoiceData["status"]) {
    setStatusUpdating((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await api.put<{ success: boolean }>(`/invoices/${id}`, { status })
      if (!res.success) throw new Error("Failed to update invoice status.")

      toast.success(`Invoice marked as ${statusConfig[status].label.toLowerCase()}.`)
      await loadInvoices()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update invoice. Please try again."
      toast.error(message)
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleShareInvoice = async (invoice: InvoiceData) => {
    try {
      await shareInvoicePdf(invoice)
      toast.success("Invoice PDF is ready to share.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unable to share invoice.")
    }
  }

  const downloadInvoicePdf = (invoice: InvoiceData) => {
    const url = URL.createObjectURL(createInvoicePdf(invoice, formatAmount))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${invoice.invoiceNumber}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Invoice PDF downloaded.")
  }

  const shareInvoicePdf = async (invoice: InvoiceData): Promise<boolean> => {
    const file = new File([createInvoicePdf(invoice, formatAmount)], `${invoice.invoiceNumber}.pdf`, { type: "application/pdf" })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: `Invoice ${invoice.invoiceNumber}`, files: [file] })
      return true
    }
    downloadInvoicePdf(invoice)
    return false
  }

  const handleSendAndMarkSent = async () => {
    if (!sentInvoice) return
    await shareInvoicePdf(sentInvoice)
    if (sentInvoice.clientEmail) {
      const subject = encodeURIComponent(`Invoice ${sentInvoice.invoiceNumber}`)
      const body = encodeURIComponent(`Invoice ${sentInvoice.invoiceNumber} PDF has been downloaded. Please attach the PDF before sending.`)
      window.open(`mailto:${sentInvoice.clientEmail}?subject=${subject}&body=${body}`, "_blank")
    }
    await handleStatusChange(sentInvoice.id, "sent")
    setSentInvoice(null)
  }

  const handleWhatsAppAndMarkSent = async () => {
    if (!sentInvoice) return
    const rawPhone = (sentInvoice.clientPhone || "").replace(/\D/g, "")
    if (!rawPhone) {
      toast.error("This client has no phone number for WhatsApp.")
      return
    }
    const countryDigits = preferences.phoneCode.replace(/\D/g, "")
    const phone = rawPhone.startsWith(countryDigits) ? rawPhone : `${countryDigits}${rawPhone.replace(/^0+/, "")}`
    await shareInvoicePdf(sentInvoice)
    const message = encodeURIComponent(`Hello ${sentInvoice.client}, invoice ${sentInvoice.invoiceNumber} PDF has been downloaded. Please attach the PDF in this WhatsApp chat.`)
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
    await handleStatusChange(sentInvoice.id, "sent")
    setSentInvoice(null)
  }

  async function handleDelete() {
    if (!deletingInvoice) return
    try {
      const res = await api.delete<{ success: boolean }>(`/invoices/${deletingInvoice.id}`)
      if (!res.success) throw new Error("Failed to delete invoice.")

      toast.success("Invoice deleted.")
      setDeleteDialogOpen(false)
      setDeletingInvoice(null)
      await loadInvoices()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete invoice."
      toast.error(message)
    }
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track billing and payments.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold text-foreground mt-1">{invoices.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatAmount(totalPaid)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{formatAmount(totalPending)}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No invoices yet. Create your first invoice.</p>
             <Button onClick={openCreateDialog} variant="glass" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Invoice #</TableHead>
                <TableHead className="text-muted-foreground">Client</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground">Issued</TableHead>
                <TableHead className="text-muted-foreground">Due</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-border hover:bg-muted">
                  <TableCell className="font-mono text-sm text-foreground">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.client}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {invoice.description ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">{formatAmount(invoice.amount)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[invoice.status].className}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit invoice"
                        onClick={() => openEditDialog(invoice)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Preview invoice"
                        onClick={() => setPreviewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Share invoice PDF"
                        onClick={() => handleShareInvoice(invoice)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      {invoice.status !== "paid" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          disabled={!!statusUpdating[invoice.id]}
                          onClick={() => {
                            const nextStatus = invoice.status === "draft" ? "sent" : invoice.status === "sent" ? "paid" : "sent"
                             if (invoice.status === "draft") setSentInvoice(invoice)
                             else handleStatusChange(invoice.id, nextStatus)
                          }}
                        >
                          {statusUpdating[invoice.id]
                            ? "Updating..."
                            : invoice.status === "draft" ? "Mark Sent" : "Mark Paid"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => { setDeletingInvoice(invoice); setDeleteDialogOpen(true) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingInvoice ? "Update the invoice details below." : "Fill in the details to create a new invoice."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Client *</Label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-border"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Invoice description..."
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Amount ({preferences.currency}) *</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceData["status"] })}
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-border"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Issue Date</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Due Date *</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.clientId || !form.amount || !form.dueDate || saving}
              className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] text-white"
            >
              {saving ? "Saving..." : editingInvoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewInvoice} onOpenChange={(open) => { if (!open) setPreviewInvoice(null) }}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewInvoice && (
            <>
              <DialogHeader className="border-b border-border pb-5">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">ClientRegit</p>
                    <DialogTitle className="mt-2 text-2xl">Invoice {previewInvoice.invoiceNumber}</DialogTitle>
                  </div>
                  <Badge className={statusConfig[previewInvoice.status].className}>
                    {statusConfig[previewInvoice.status].label}
                  </Badge>
                </div>
                <DialogDescription className="text-muted-foreground">
                  Issued {formatDate(previewInvoice.issueDate)} · Due {formatDate(previewInvoice.dueDate)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                <div className="flex items-start justify-between gap-6 border-b border-border pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
                    <p className="mt-1 font-semibold text-foreground">{previewInvoice.editorName || user?.name || "Editor"}</p>
                    <p className="text-sm text-muted-foreground">{previewInvoice.editorEmail || user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Bill To</p>
                    <p className="mt-1 font-semibold text-foreground">{previewInvoice.client}</p>
                    <p className="text-sm text-muted-foreground">{previewInvoice.clientEmail || "No email provided"}</p>
                    {previewInvoice.clientCompany && <p className="text-sm text-muted-foreground">{previewInvoice.clientCompany}</p>}
                    {previewInvoice.clientPhone && <p className="text-sm text-muted-foreground">{previewInvoice.clientPhone}</p>}
                    {(previewInvoice.clientAddress || previewInvoice.clientCity || previewInvoice.clientState || previewInvoice.clientCountry) && (
                      <p className="text-sm text-muted-foreground">
                        {[previewInvoice.clientAddress, previewInvoice.clientCity, previewInvoice.clientState, previewInvoice.clientCountry].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice Details</p>
                    <p className="mt-1 text-sm text-muted-foreground">Issued: <span className="text-foreground">{formatDate(previewInvoice.issueDate)}</span></p>
                    <p className="text-sm text-muted-foreground">Due: <span className="text-foreground">{formatDate(previewInvoice.dueDate)}</span></p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{formatAmount(previewInvoice.amount)}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-center justify-between bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 px-4 py-4">
                    <p className="text-sm text-foreground">{previewInvoice.description || "Professional creative services"}</p>
                    <p className="shrink-0 text-sm font-semibold text-foreground">{formatAmount(previewInvoice.amount)}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 border-t border-border pt-5">
                  <InvoiceQRCode invoiceId={previewInvoice.id} />
                  <p className="text-xs text-muted-foreground">Scan to open this invoice</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-border text-foreground" onClick={() => handleShareInvoice(previewInvoice)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share PDF
                </Button>
                <Button onClick={() => setPreviewInvoice(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sentInvoice} onOpenChange={(open) => { if (!open) setSentInvoice(null) }}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          {sentInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Mark Invoice as Sent</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Choose how to share the generated PDF before marking the invoice as sent. No invoice link is sent.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Client</p>
                  <p className="mt-1 font-medium text-foreground">{sentInvoice.client}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{sentInvoice.clientEmail || "No email provided"}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{sentInvoice.clientPhone || "No phone number provided"}</p>
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button onClick={handleSendAndMarkSent} className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Share PDF, Open Email Draft, and Mark Sent
                </Button>
                <Button onClick={handleWhatsAppAndMarkSent} variant="outline" className="w-full border-green-500/40 text-green-700 hover:bg-green-500/10 dark:text-green-400">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share PDF with WhatsApp and Mark Sent
                </Button>
                <Button variant="outline" onClick={() => { handleStatusChange(sentInvoice.id, "sent"); setSentInvoice(null) }} className="w-full border-border text-foreground">
                  Don&apos;t Send, Just Mark as Sent
                </Button>
                <Button variant="ghost" onClick={() => setSentInvoice(null)} className="w-full text-muted-foreground">Cancel</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete invoice{" "}
              <span className="text-foreground font-medium">{deletingInvoice?.invoiceNumber}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
