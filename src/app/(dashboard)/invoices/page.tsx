"use client"

import { useEffect, useState } from "react"
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
import { FileText, Plus } from "lucide-react"
import { formatINR, formatDate, generateInvoiceNumber } from "@/lib/utils"

interface InvoiceData {
  id: string
  invoice_number: string
  client: string
  description: string | null
  amount: number
  issue_date: string
  due_date: string
  status: "draft" | "sent" | "paid" | "overdue"
}

const demoInvoices: InvoiceData[] = [
  { id: "1", invoice_number: "INV-2608-0001", client: "Rahul Media", description: "YouTube Episode 41 — Edit & Color Grade", amount: 45000, issue_date: "2026-08-01", due_date: "2026-08-15", status: "paid" },
  { id: "2", invoice_number: "INV-2608-0002", client: "Pixel Studios", description: "Instagram Reel Campaign — Batch 1", amount: 25000, issue_date: "2026-08-10", due_date: "2026-08-24", status: "sent" },
  { id: "3", invoice_number: "INV-2608-0003", client: "Creator Labs", description: "Product Commercial — Pre-production", amount: 60000, issue_date: "2026-08-15", due_date: "2026-08-29", status: "sent" },
  { id: "4", invoice_number: "INV-2607-0008", client: "ABC Marketing", description: "Corporate Training Videos — June", amount: 80000, issue_date: "2026-07-01", due_date: "2026-07-15", status: "overdue" },
  { id: "5", invoice_number: "INV-2608-0004", client: "Rahul Media", description: "YouTube Episode 42 — Edit", amount: 45000, issue_date: "2026-08-20", due_date: "2026-09-03", status: "draft" },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-white/10 text-white/60 border-0" },
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
  const [isDemo, setIsDemo] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadInvoices() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("invoices")
          .select("*, clients(name)")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })

        if (data && data.length > 0) {
          setIsDemo(false)
          setInvoices(
            data.map((inv: any) => ({
              id: inv.id,
              invoice_number: inv.invoice_number,
              client: inv.clients?.name ?? "Unknown",
              description: inv.description,
              amount: inv.amount,
              issue_date: inv.issue_date,
              due_date: inv.due_date,
              status: inv.status,
            }))
          )
        } else {
          setInvoices(demoInvoices)
        }
      } catch {
        setInvoices(demoInvoices)
      }
    }

    loadInvoices()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const newInvoice: InvoiceData = {
        id: Date.now().toString(),
        invoice_number: generateInvoiceNumber(),
        client: form.client,
        description: form.description || null,
        amount: Number(form.amount),
        issue_date: form.issue_date || today,
        due_date: form.due_date,
        status: form.status,
      }
      setInvoices((prev) => [newInvoice, ...prev])
      setDialogOpen(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-white/50 mt-1">Track billing and payments.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {isDemo && (
        <Badge variant="glass" className="text-xs">
          Showing demo data — connect Supabase to load real invoices
        </Badge>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-sm text-white/50">Total Invoices</p>
          <p className="text-2xl font-bold text-white mt-1">{invoices.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-white/50">Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatINR(totalPaid)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-white/50">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{formatINR(totalPending)}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 mb-4">No invoices yet. Create your first invoice to get started.</p>
            <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} variant="glass" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Invoice #</TableHead>
                <TableHead className="text-white/60">Client</TableHead>
                <TableHead className="text-white/60">Description</TableHead>
                <TableHead className="text-white/60 text-right">Amount</TableHead>
                <TableHead className="text-white/60">Issued</TableHead>
                <TableHead className="text-white/60">Due</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-mono text-sm text-white">{invoice.invoice_number}</TableCell>
                  <TableCell className="text-white/60">{invoice.client}</TableCell>
                  <TableCell className="text-white/60 text-sm max-w-[200px] truncate">
                    {invoice.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-white">{formatINR(invoice.amount)}</TableCell>
                  <TableCell className="text-white/60 text-sm">{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell className="text-white/60 text-sm">{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[invoice.status].className}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141E3A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription className="text-white/50">
              Fill in the details to create a new invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/70">Client *</Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Client name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Invoice description..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Amount (₹) *</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceData["status"] })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
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
                <Label className="text-white/70">Issue Date</Label>
                <Input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Due Date *</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/60 hover:text-white">
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
    </div>
  )
}
