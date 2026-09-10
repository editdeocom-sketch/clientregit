import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, Users, Plus, Trash2 } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  sub_status: string | null;
  sub_currency: string | null;
  sub_amount: number | null;
  sub_expires: string | null;
  plan_slug: string | null;
  plan_name: string | null;
  total_storage: number;
  video_count: number;
}

interface PaginatedResponse {
  success: boolean;
  data: UserData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getStatusBadge(status: string | null) {
  if (!status) return <Badge variant="secondary">Free</Badge>;
  const variants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    active: 'success',
    pending: 'warning',
    cancelled: 'destructive',
    expired: 'destructive',
    failed: 'destructive',
  };
  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

function getRoleBadge(role: string) {
  if (role === 'admin') return <Badge variant="info">Admin</Badge>;
  return <Badge variant="secondary">{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';

  const [searchInput, setSearchInput] = useState(search);

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('user');

  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (status) params.set('status', status);

      const res = await api.get<PaginatedResponse>(`/admin/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = () => {
    setSearchParams((prev) => { prev.set('search', searchInput); prev.set('page', '1'); return prev; });
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value); else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const handleCreateUser = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }
    setAddLoading(true);
    try {
      await api.post('/admin/users', { name: addName.trim(), email: addEmail.trim(), password: addPassword, role: addRole });
      toast.success('User created');
      setAddOpen(false);
      setAddName(''); setAddEmail(''); setAddPassword(''); setAddRole('user');
      loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">Manage platform users ({total} total)</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-muted-foreground mb-2 block">Search</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} variant="secondary">Search</Button>
              </div>
            </div>

            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Role</Label>
              <Select value={role || 'all'} onValueChange={(v) => handleFilterChange('role', v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Status</Label>
              <Select value={status || 'all'} onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.id}</TableCell>
                    <TableCell
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                    >{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{u.plan_name || <span className="text-muted-foreground">Free</span>}</TableCell>
                    <TableCell>{getStatusBadge(u.sub_status)}</TableCell>
                    <TableCell className="text-xs">{formatBytes(u.total_storage)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} users</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setSearchParams((prev) => { prev.set('page', String(page - 1)); return prev; })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages}
              onClick={() => setSearchParams((prev) => { prev.set('page', String(page + 1)); return prev; })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={addLoading}>
              {addLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
