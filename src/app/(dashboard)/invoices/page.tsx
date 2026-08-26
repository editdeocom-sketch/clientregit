"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { FileText, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatINR, formatDate, generateInvoiceNumber } from "@/lib/utils"

interface InvoiceData {
  id: string
  invoice_number: string
  client: string
  client_id: string
  description: string | null
  amount: number
  issue_date: string
  due_date: string
  status: "draft" | "sent" | "paid" | "overdue"
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-0" },
  sent: { label: "Sent", className: "bg-blue-500/20 text-blue-400 border-0" },
  paid: { label: "Paid", className: "bg-green-500/20 text-green-400 border-0" },
  overdue: { label: "Overdue", className: "bg-red-500/20 text-red-400 border-0" },
}

const emptyForm = {
  client: "",
  description: "",
  amount: "",
  issue_date: "",
  due_date: "",
  status: "draft" as InvoiceData["status"],
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadInvoices = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients!inner(name, editor_id)")
        .eq("clients.editor_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        setInvoices(
          data.map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            client: inv.clients?.name ?? "Unknown",
            client_id: inv.client_id,
            description: inv.description,
            amount: inv.amount,
            issue_date: inv.issue_date,
            due_date: inv.due_date,
            status: inv.status,
          }))
        )
      }
    } catch {
      setInvoices([])
    }
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in.")
        return
      }

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("editor_id", user.id)
        .ilike("name", form.client)
        .single()

      if (clientError || !clientData) {
        toast.error("Client not found. Please check the client name.")
        return
      }

      const today = new Date().toISOString().split("T")[0]

      const { error } = await supabase.from("invoices").insert({
        invoice_number: generateInvoiceNumber(),
        client_id: clientData.id,
        description: form.description || null,
        amount: Number(form.amount),
        issue_date: form.issue_date || today,
        due_date: form.due_date,
        status: form.status,
      })

      if (error) throw error

      toast.success("Invoice created successfully.")
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
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id)

      if (error) throw error

      toast.success(`Invoice marked as ${statusConfig[status].label.toLowerCase()}.`)
      await loadInvoices()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update invoice status."
      toast.error(message)
    }
  }

  async function handleDelete() {
    if (!deletingInvoice) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", deletingInvoice.id)

      if (error) throw error

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
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
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
          <p className="text-2xl font-bold text-green-400 mt-1">{formatINR(totalPaid)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{formatINR(totalPending)}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No invoices yet. Create your first invoice.</p>
            <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} variant="glass" size="sm">
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
                  <TableCell className="font-mono text-sm text-foreground">{invoice.invoice_number}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.client}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {invoice.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">{formatINR(invoice.amount)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[invoice.status].className}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status !== "paid" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const nextStatus = invoice.status === "draft" ? "sent" : invoice.status === "sent" ? "paid" : "sent"
                            handleStatusChange(invoice.id, nextStatus)
                          }}
                        >
                          {invoice.status === "draft" ? "Mark Sent" : "Mark Paid"}
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
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details to create a new invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Client *</Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Client name"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
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
                <Label className="text-muted-foreground">Amount (₹) *</Label>
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
                  value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Due Date *</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
              disabled={!form.client || !form.amount || !form.due_date || saving}
              className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] text-white"
            >
              {saving ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete invoice{" "}
              <span className="text-foreground font-medium">{deletingInvoice?.invoice_number}</span>?
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
