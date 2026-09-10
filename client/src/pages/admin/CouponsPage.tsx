import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tags, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  currency: string | null;
  plan_slugs: string | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  active: number;
  created_at: string;
  redemption_count: number;
}

interface PaginatedResponse {
  success: boolean;
  data: Coupon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CouponFormData {
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  currency: string;
  plan_slugs: string;
  max_uses: string;
  valid_from: string;
  valid_until: string;
}

const defaultFormData: CouponFormData = {
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: 0,
  currency: '',
  plan_slugs: '',
  max_uses: '',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
};

export default function CouponsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      const res = await api.get<PaginatedResponse>(`/admin/coupons?${params.toString()}`);
      if (res.success) {
        setCoupons(res.data);
        setTotal(res.total);
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const openCreateDialog = () => {
    setEditingCoupon(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      currency: coupon.currency || '',
      plan_slugs: coupon.plan_slugs || '',
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      valid_from: coupon.valid_from || '',
      valid_until: coupon.valid_until || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }

    setSaving(true);
    try {
      const body = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        currency: formData.currency || null,
        plan_slugs: formData.plan_slugs || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
      };

      if (editingCoupon) {
        const res = await api.put<{ success: boolean }>(`/admin/coupons/${editingCoupon.id}`, body);
        if (res.success) {
          toast.success('Coupon updated');
          loadCoupons();
          setDialogOpen(false);
        }
      } else {
        const res = await api.post<{ success: boolean }>('/admin/coupons', body);
        if (res.success) {
          toast.success('Coupon created');
          loadCoupons();
          setDialogOpen(false);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const res = await api.put<{ success: boolean }>(`/admin/coupons/${coupon.id}/toggle`);
      if (res.success) {
        toast.success(coupon.active ? 'Coupon disabled' : 'Coupon enabled');
        loadCoupons();
      }
    } catch {
      toast.error('Failed to toggle coupon');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to archive coupon "${coupon.code}"?`)) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/admin/coupons/${coupon.id}`);
      if (res.success) {
        toast.success('Coupon archived');
        loadCoupons();
      }
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchInput.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tags className="h-6 w-6" />
            Coupons
          </h1>
          <p className="text-muted-foreground mt-1">Manage discount coupons ({total} total)</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coupons by code or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No coupons found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Max Uses</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-bold">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{coupon.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percent' ? (
                        <span>{coupon.discount_value}% off</span>
                      ) : (
                        <span>₹{coupon.discount_value} off</span>
                      )}
                    </TableCell>
                    <TableCell>{coupon.currency || 'All'}</TableCell>
                    <TableCell>{coupon.redemption_count}</TableCell>
                    <TableCell>{coupon.max_uses || 'Unlimited'}</TableCell>
                    <TableCell>
                      {coupon.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)} aria-label={`Edit coupon ${coupon.code}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggle(coupon)} aria-label={`${coupon.active ? "Deactivate" : "Activate"} coupon ${coupon.code}`}>
                          {coupon.active ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon)} aria-label={`Delete coupon ${coupon.code}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update the coupon details.' : 'Create a new discount coupon.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g., SUMMER20"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, discount_type: v as 'percent' | 'fixed' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency (leave empty for all)</Label>
              <Input
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                placeholder="e.g., INR, USD"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Uses (leave empty for unlimited)</Label>
              <Input
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData((prev) => ({ ...prev, max_uses: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData((prev) => ({ ...prev, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData((prev) => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
