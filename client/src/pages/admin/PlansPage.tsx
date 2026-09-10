import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Save, Loader2 } from 'lucide-react';

interface Plan {
  id: number;
  slug: string;
  name: string;
  active: number;
  storage_bytes: number;
  prices_json: string;
  prices: Record<string, number>;
  config: {
    slug: string;
    name: string;
    storageGB: number;
    recurring: boolean;
    prices: Record<string, number>;
  };
  created_at: string;
  updated_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb} GB` : `${bytes / (1024 * 1024)} MB`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, {
    name: string;
    active: boolean;
    storage_bytes: number;
    prices: Record<string, number>;
  }>>({});

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Plan[] }>('/admin/plans');
      if (res.success) {
        setPlans(res.data);
        const initialEdits: Record<number, typeof edits[0]> = {};
        res.data.forEach((plan) => {
          initialEdits[plan.id] = {
            name: plan.name,
            active: plan.active === 1,
            storage_bytes: plan.storage_bytes,
            prices: plan.prices || {},
          };
        });
        setEdits(initialEdits);
      }
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (planId: number) => {
    const edit = edits[planId];
    if (!edit) return;

    setSaving(planId);
    try {
      const res = await api.put<{ success: boolean }>(`/admin/plans/${planId}`, {
        name: edit.name,
        active: edit.active,
        storage_bytes: edit.storage_bytes,
        prices_json: edit.prices,
      });
      if (res.success) {
        toast.success('Plan updated successfully');
        loadPlans();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setSaving(null);
    }
  };

  const updateEdit = (planId: number, field: string, value: unknown) => {
    setEdits((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const updatePrice = (planId: number, currency: string, value: string) => {
    const numVal = parseInt(value) || 0;
    setEdits((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        prices: { ...prev[planId].prices, [currency]: numVal },
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6" />
          Plans
        </h1>
        <p className="text-muted-foreground mt-1">Manage subscription plans and pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const edit = edits[plan.id];
          if (!edit) return null;

          return (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{edit.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {plan.config?.recurring ? (
                      <Badge variant="info">Recurring</Badge>
                    ) : (
                      <Badge variant="warning">One-time</Badge>
                    )}
                    <Badge variant={edit.active ? 'success' : 'secondary'}>
                      {edit.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Plan Name</Label>
                  <Input
                    value={edit.name}
                    onChange={(e) => updateEdit(plan.id, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Slug</Label>
                  <Input value={plan.slug} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Storage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={edit.storage_bytes}
                      onChange={(e) => updateEdit(plan.id, 'storage_bytes', parseInt(e.target.value) || 0)}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{formatBytes(edit.storage_bytes)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Pricing (INR)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                      <Input
                        type="number"
                        value={edit.prices.INR_monthly || 0}
                        onChange={(e) => updatePrice(plan.id, 'INR_monthly', e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Yearly</p>
                      <Input
                        type="number"
                        value={edit.prices.INR_yearly || 0}
                        onChange={(e) => updatePrice(plan.id, 'INR_yearly', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Pricing (USD)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                      <Input
                        type="number"
                        value={edit.prices.USD_monthly || 0}
                        onChange={(e) => updatePrice(plan.id, 'USD_monthly', e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Yearly</p>
                      <Input
                        type="number"
                        value={edit.prices.USD_yearly || 0}
                        onChange={(e) => updatePrice(plan.id, 'USD_yearly', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={edit.active}
                    onClick={() => updateEdit(plan.id, 'active', !edit.active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      edit.active ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        edit.active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(plan.id)}
                    disabled={saving === plan.id}
                    className="gap-2"
                  >
                    {saving === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
