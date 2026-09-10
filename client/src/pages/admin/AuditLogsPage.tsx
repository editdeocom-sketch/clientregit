import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
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
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target_type: string;
  target_id: number | null;
  metadata: Record<string, unknown>;
  ip_address: string;
  created_at: string;
  admin_name: string;
  admin_email: string;
}

interface PaginatedResponse {
  success: boolean;
  data: AuditLog[];
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
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatMetadata(metadata: Record<string, unknown>): string {
  if (!metadata || Object.keys(metadata).length === 0) return '-';
  const entries = Object.entries(metadata)
    .filter(([key]) => !['password', 'token', 'password_hash'].includes(key))
    .slice(0, 3);
  return entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ');
}

const ACTION_OPTIONS = [
  { value: 'USER_ROLE_CHANGED', label: 'User Role Changed' },
  { value: 'USER_ENABLED', label: 'User Enabled' },
  { value: 'USER_DISABLED', label: 'User Disabled' },
  { value: 'PRICE_UPDATED', label: 'Price Updated' },
  { value: 'COUPON_CREATED', label: 'Coupon Created' },
  { value: 'COUPON_UPDATED', label: 'Coupon Updated' },
  { value: 'COUPON_ENABLED', label: 'Coupon Enabled' },
  { value: 'COUPON_DISABLED', label: 'Coupon Disabled' },
  { value: 'COUPON_DELETED', label: 'Coupon Deleted' },
  { value: 'SETTINGS_CHANGED', label: 'Settings Changed' },
  { value: 'SEO_SETTINGS_CHANGED', label: 'SEO Settings Changed' },
  { value: 'AD_SETTINGS_CHANGED', label: 'Ad Settings Changed' },
  { value: 'LEGAL_PAGE_UPDATED', label: 'Legal Page Updated' },
  { value: 'ENTITLEMENT_GRANTED', label: 'Entitlement Granted' },
  { value: 'ENTITLEMENT_REVOKED', label: 'Entitlement Revoked' },
];

export default function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get('page') || '1');
  const actionFilter = searchParams.get('action') || '';
  const adminFilter = searchParams.get('admin') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const [dateFromInput, setDateFromInput] = useState(dateFrom);
  const [dateToInput, setDateToInput] = useState(dateTo);
  const [adminInput, setAdminInput] = useState(adminFilter);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (actionFilter) params.set('action', actionFilter);
      if (adminFilter) params.set('admin', adminFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await api.get<PaginatedResponse>(`/admin/audit-logs?${params.toString()}`);
      if (res.success) {
        setLogs(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, adminFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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

  const handleAdminFilter = () => {
    handleFilterChange('admin', adminInput);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground mt-1">Track admin actions ({total} entries)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Label className="text-muted-foreground mb-2 block">Action</Label>
              <Select value={actionFilter || 'all'} onValueChange={(v) => handleFilterChange('action', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40">
              <Label className="text-muted-foreground mb-2 block">Admin ID</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  placeholder="User ID"
                />
                <Button onClick={handleAdminFilter} variant="secondary" size="sm">
                  Go
                </Button>
              </div>
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
                Apply
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
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No audit logs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.admin_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{log.admin_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.target_type}
                      {log.target_id ? ` #${log.target_id}` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                      {formatMetadata(log.metadata)}
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
            Page {page} of {totalPages} · {total} entries
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
