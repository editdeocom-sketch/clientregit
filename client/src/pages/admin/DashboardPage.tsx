import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  CreditCard,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  Activity,
  FileText,
  Tags,
} from 'lucide-react';

interface DashboardData {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    free: number;
    pro: number;
    lifetime: number;
  };
  subscriptions: {
    active: number;
    pending: number;
    cancelled: number;
    expired: number;
    failed: number;
  };
  revenue: {
    total: number;
    monthly: number;
    lifetime: number;
  };
  coupons: {
    total: number;
    used: number;
  };
  storage: {
    totalBytes: number;
  };
  projects: number;
  invoices: number;
  payments: {
    failed: number;
  };
  webhooks: {
    failures: number;
  };
  recentActivity: Array<{
    id: number;
    user_id: number;
    action: string;
    target_type: string;
    target_id: number;
    created_at: string;
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatCurrency(amount: number, currency?: string): string {
  const cur = currency || 'INR';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get<{ success: boolean; data: DashboardData }>('/admin/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{data?.users.total ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{data?.users.newToday ?? 0} today · +{data?.users.newThisWeek ?? 0} this week
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data?.revenue.total ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(data?.revenue.monthly ?? 0)} this month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold mt-1">{data?.subscriptions.active ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.subscriptions.pending ?? 0} pending · {data?.subscriptions.expired ?? 0} expired
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Storage</p>
                <p className="text-2xl font-bold mt-1">{formatBytes(data?.storage.totalBytes ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.users.free ?? 0} free · {data?.users.pro ?? 0} pro · {data?.users.lifetime ?? 0} lifetime
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold mt-1">{data?.projects ?? 0}</p>
              </div>
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold mt-1">{data?.invoices ?? 0}</p>
              </div>
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coupons</p>
                <p className="text-2xl font-bold mt-1">{data?.coupons.total ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{data?.coupons.used ?? 0} used</p>
              </div>
              <Tags className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {(data?.payments.failed ?? 0) > 0 || (data?.webhooks.failures ?? 0) > 0 ? (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Attention Needed</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {data?.payments.failed ?? 0} failed payments · {data?.webhooks.failures ?? 0} webhook failures
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {activity.action[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.target_type} #{activity.target_id}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
