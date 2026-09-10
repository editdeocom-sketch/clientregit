import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Payment {
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
  plan_slug: string;
  user_name: string;
  user_email: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Payment[];
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
    captured: 'success',
    completed: 'success',
    pending: 'warning',
    failed: 'destructive',
    refunded: 'destructive',
  };
  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || '';
  const currencyFilter = searchParams.get('currency') || '';
  const planFilter = searchParams.get('plan') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const [dateFromInput, setDateFromInput] = useState(dateFrom);
  const [dateToInput, setDateToInput] = useState(dateTo);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);
      if (currencyFilter) params.set('currency', currencyFilter);
      if (planFilter) params.set('plan', planFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await api.get<PaginatedResponse>(`/admin/payments?${params.toString()}`);
      if (res.success) {
        setPayments(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, currencyFilter, planFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const handleDateFilter = () => {
    setSearchParams((prev) => {
      if (dateFromInput) prev.set('dateFrom', dateFromInput);
      else prev.delete('dateFrom');
      if (dateToInput) prev.set('dateTo', dateToInput);
      else prev.delete('dateTo');
      prev.set('page', '1');
      return prev;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Payments
        </h1>
        <p className="text-muted-foreground mt-1">View payment history ({total} total)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Status</Label>
              <Select value={statusFilter || 'all'} onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
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
              <Label className="text-muted-foreground mb-2 block">From</Label>
              <Input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
              />
            </div>

            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">To</Label>
              <Input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleDateFilter} variant="secondary">
                Apply Dates
              </Button>
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
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No payments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{payment.user_name}</p>
                        <p className="text-xs text-muted-foreground">{payment.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.plan_name}</TableCell>
                    <TableCell>{payment.currency}</TableCell>
                    <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                    <TableCell>
                      {payment.discount > 0 ? (
                        <span className="text-green-600">-{formatCurrency(payment.discount, payment.currency)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.created_at)}
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
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} payments
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
