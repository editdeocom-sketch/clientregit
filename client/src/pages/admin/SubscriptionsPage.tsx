import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Subscription {
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
  user_name: string;
  user_email: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function getStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    active: 'success',
    pending: 'warning',
    cancelled: 'destructive',
    expired: 'destructive',
    failed: 'destructive',
  };
  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

export default function SubscriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get('page') || '1');
  const planFilter = searchParams.get('plan') || '';
  const statusFilter = searchParams.get('status') || '';
  const currencyFilter = searchParams.get('currency') || '';

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (planFilter) params.set('plan', planFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (currencyFilter) params.set('currency', currencyFilter);

      const res = await api.get<PaginatedResponse>(`/admin/subscriptions?${params.toString()}`);
      if (res.success) {
        setSubscriptions(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [page, planFilter, statusFilter, currencyFilter]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Subscriptions
        </h1>
        <p className="text-muted-foreground mt-1">Manage subscriptions ({total} total)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Plan</Label>
              <Select value={planFilter || 'all'} onValueChange={(v) => handleFilterChange('plan', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Status</Label>
              <Select value={statusFilter || 'all'} onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Currency</Label>
              <Select value={currencyFilter || 'all'} onValueChange={(v) => handleFilterChange('currency', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
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
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No subscriptions found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sub.user_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sub.plan_name}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{sub.currency}</TableCell>
                    <TableCell>{formatCurrency(sub.amount, sub.currency)}</TableCell>
                    <TableCell className="text-sm">{sub.provider}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(sub.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} subscriptions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setSearchParams((prev) => { prev.set('page', String(page - 1)); return prev; })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setSearchParams((prev) => { prev.set('page', String(page + 1)); return prev; })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
