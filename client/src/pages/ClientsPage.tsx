import { useEffect, useState } from "react"
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
import { toast } from "sonner"
import api from "@/services/api"

interface ClientData {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  notes: string | null
  status: "active" | "inactive"
}

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  const [deletingClient, setDeletingClient] = useState<ClientData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadClients() {
    try {
      const res = await api.get<{ success: boolean; data: ClientData[] }>('/clients')
      if (res.success) {
        setClients(res.data)
      }
    } catch {
      setClients([])
    }
  }

  useEffect(() => {
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
        await api.put(`/clients/${editingClient.id}`, {
          name: form.name,
          email: form.email,
          company: form.company || null,
          phone: form.phone || null,
          notes: form.notes || null,
          status: form.status,
        })
        toast.success("Client updated successfully.")
      } else {
        await api.post('/clients', {
          name: form.name,
          email: form.email,
          company: form.company || null,
          phone: form.phone || null,
          notes: form.notes || null,
          status: form.status,
        })
        toast.success("Client added successfully.")
      }

      setDialogOpen(false)
      await loadClients()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingClient) return
    try {
      await api.delete(`/clients/${deletingClient.id}`)
      toast.success("Client deleted.")
      setDeleteDialogOpen(false)
      setDeletingClient(null)
      await loadClients()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete client."
      toast.error(message)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client directory.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <GlassCard className="overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
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
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Company</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-border hover:bg-muted">
                  <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-muted-foreground">{client.company ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{client.phone ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        client.status === "active"
                          ? "bg-green-500/20 text-green-400 border-0"
                          : "bg-muted text-muted-foreground border-0"
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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
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
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingClient ? "Update the client details below." : "Fill in the details to add a new client."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Client name"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Company</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Company name"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this client..."
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-border"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
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
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="text-foreground font-medium">{deletingClient?.name}</span>?
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
