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
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react"

interface ClientData {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  notes: string | null
  status: "active" | "inactive"
}

const demoClients: ClientData[] = [
  { id: "1", name: "Rahul Sharma", email: "rahul@rahulmedia.com", company: "Rahul Media", phone: "+91 98765 43210", notes: "YouTube content creator", status: "active" },
  { id: "2", name: "Priya Patel", email: "priya@pixelstudios.in", company: "Pixel Studios", phone: "+91 98765 12345", notes: "Short-form content specialist", status: "active" },
  { id: "3", name: "Amit Singh", email: "amit@creatorlabs.co", company: "Creator Labs", phone: "+91 99887 66554", notes: "Product launches", status: "active" },
  { id: "4", name: "Neha Gupta", email: "neha@abcmarketing.com", company: "ABC Marketing", phone: "+91 88776 55443", notes: "Corporate videos", status: "inactive" },
]

const emptyForm: { name: string; email: string; company: string; phone: string; notes: string; status: "active" | "inactive" } = {
  name: "",
  email: "",
  company: "",
  phone: "",
  notes: "",
  status: "active",
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([])
  const [search, setSearch] = useState("")
  const [isDemo, setIsDemo] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  const [deletingClient, setDeletingClient] = useState<ClientData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadClients() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("editor_id", user.id)
          .order("created_at", { ascending: false })

        if (data && data.length > 0) {
          setIsDemo(false)
          setClients(data as ClientData[])
        } else {
          setClients(demoClients)
        }
      } catch {
        setClients(demoClients)
      }
    }

    loadClients()
  }, [])

  useEffect(() => {
    if (!search) {
      setFilteredClients(clients)
    } else {
      const q = search.toLowerCase()
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company && c.company.toLowerCase().includes(q))
        )
      )
    }
  }, [search, clients])

  function openAddDialog() {
    setEditingClient(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(client: ClientData) {
    setEditingClient(client)
    setForm({
      name: client.name,
      email: client.email,
      company: client.company ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? "",
      status: client.status,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(client: ClientData) {
    setDeletingClient(client)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingClient) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === editingClient.id
              ? { ...c, ...form, company: form.company || null, phone: form.phone || null, notes: form.notes || null }
              : c
          )
        )
      } else {
        const newClient: ClientData = {
          id: Date.now().toString(),
          name: form.name,
          email: form.email,
          company: form.company || null,
          phone: form.phone || null,
          notes: form.notes || null,
          status: form.status,
        }
        setClients((prev) => [newClient, ...prev])
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingClient) return
    setClients((prev) => prev.filter((c) => c.id !== deletingClient.id))
    setDeleteDialogOpen(false)
    setDeletingClient(null)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-white/50 mt-1">Manage your client directory.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {isDemo && (
        <Badge variant="glass" className="text-xs">
          Showing demo data — connect Supabase to load real clients
        </Badge>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          placeholder="Search clients by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      <GlassCard className="overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 mb-4">
              {search ? "No clients match your search." : "No clients yet. Add your first client to get started."}
            </p>
            {!search && (
              <Button onClick={openAddDialog} variant="glass" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60">Company</TableHead>
                <TableHead className="text-white/60">Phone</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{client.name}</TableCell>
                  <TableCell className="text-white/60">{client.email}</TableCell>
                  <TableCell className="text-white/60">{client.company ?? "—"}</TableCell>
                  <TableCell className="text-white/60">{client.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        client.status === "active"
                          ? "bg-green-500/20 text-green-400 border-0"
                          : "bg-white/10 text-white/50 border-0"
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-white"
                        onClick={() => openEditDialog(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-red-400"
                        onClick={() => openDeleteDialog(client)}
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
        <DialogContent className="bg-[#141E3A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription className="text-white/50">
              {editingClient ? "Update the client details below." : "Fill in the details to add a new client."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/70">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Client name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Company</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Company name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this client..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/60 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.email || saving}
              className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] text-white"
            >
              {saving ? "Saving..." : editingClient ? "Update" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#141E3A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription className="text-white/50">
              Are you sure you want to delete <span className="text-white font-medium">{deletingClient?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-white/60 hover:text-white">
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
