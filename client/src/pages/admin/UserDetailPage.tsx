import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  CreditCard,
  HardDrive,
  Activity,
  Gift,
  Ban,
} from 'lucide-react';

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  subscription: {
    id: number;
    user_id: number;
    plan_id: number;
    provider: string;
    status: string;
    currency: string;
    amount: number;
    started_at: string;
    expires_at: string | null;
    created_at: string;
    plan_slug: string;
    plan_name: string;
    storage_bytes: number;
    prices_json: string;
  } | null;
  billingHistory: Array<{
    id: number;
    user_id: number;
    plan_id: number;
    provider: string;
    provider_payment_id: string;
    currency: string;
    amount: number;
    discount: number;
    status: string;
    payment_type: string;
    paid_at: string;
    created_at: string;
    plan_name: string;
  }>;
  usage: {
    video_uploads_month: number;
    video_storage_bytes: number;
    invoice_count_month: number;
  };
  totalStorage: number;
  recentActivity: Array<{
    id: number;
    action: string;
    target_type: string;
    target_id: number;
    created_at: string;
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatCurrency(amount: number, currency?: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [grantPlan, setGrantPlan] = useState('');

  useEffect(() => {
    if (id) loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const res = await api.get<{ success: boolean; data: UserDetail }>(`/admin/users/${id}`);
      if (res.success) setUser(res.data);
    } catch {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await api.put<{ success: boolean }>(`/admin/users/${user.id}/role`, { role: newRole });
      if (res.success) {
        toast.success(`User role changed to ${newRole}`);
        setUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await api.put<{ success: boolean }>(`/admin/users/${user.id}/status`, { enabled: true });
      if (res.success) {
        toast.success('User status updated');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantEntitlement = async () => {
    if (!user || !grantPlan) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/admin/entitlement/grant', {
        user_id: user.id,
        plan_slug: grantPlan,
      });
      if (res.success) {
        toast.success('Entitlement granted');
        loadUser();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to grant entitlement');
    } finally {
      setActionLoading(false);
      setGrantPlan('');
    }
  };

  const handleRevokeEntitlement = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/admin/entitlement/revoke', {
        user_id: user.id,
      });
      if (res.success) {
        toast.success('Entitlement revoked');
        loadUser();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke entitlement');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">User not found</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')} aria-label="Back to users">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                    {user.name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant={user.role === 'admin' ? 'info' : 'secondary'}>{user.role}</Badge>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.subscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <span className="font-medium">{user.subscription.plan_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={user.subscription.status === 'active' ? 'success' : 'destructive'}>
                        {user.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span>{formatCurrency(user.subscription.amount, user.subscription.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Provider</span>
                      <span>{user.subscription.provider}</span>
                    </div>
                    {user.subscription.expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expires</span>
                        <span>{formatDate(user.subscription.expires_at)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No active subscription</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-xl font-bold mt-1">{formatBytes(user.totalStorage)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Videos This Month</p>
                  <p className="text-xl font-bold mt-1">{user.usage.video_uploads_month}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Invoices This Month</p>
                  <p className="text-xl font-bold mt-1">{user.usage.invoice_count_month}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              {user.billingHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.billingHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                        <TableCell>{payment.plan_name}</TableCell>
                        <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                        <TableCell>
                          {payment.discount > 0 ? formatCurrency(payment.discount, payment.currency) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'captured' || payment.status === 'completed' ? 'success' : 'destructive'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.payment_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No billing history</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {user.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {user.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.target_type} #{activity.target_id}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={user.role} onValueChange={handleRoleChange} disabled={actionLoading}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Changing role affects permissions immediately.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleStatusToggle}
                disabled={actionLoading}
                className="gap-2"
              >
                <Ban className="h-4 w-4" />
                Disable Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Entitlement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={grantPlan} onValueChange={setGrantPlan}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro_monthly">Pro Monthly</SelectItem>
                    <SelectItem value="pro_quarterly">Pro Quarterly</SelectItem>
                    <SelectItem value="pro_yearly">Pro Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGrantEntitlement}
                  disabled={actionLoading || !grantPlan}
                  className="gap-2"
                >
                  <Gift className="h-4 w-4" />
                  Grant Plan
                </Button>
              </div>
              <Separator />
              <Button
                variant="destructive"
                onClick={handleRevokeEntitlement}
                disabled={actionLoading}
                className="gap-2"
              >
                <Ban className="h-4 w-4" />
                Revoke Entitlement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
