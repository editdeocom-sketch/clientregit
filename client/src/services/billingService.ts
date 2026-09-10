import { api } from "@/services/api"

export interface PlanDefinition {
  slug: string
  name: string
  recurring: boolean
  interval: string | null
  storageBytes: number
  prices: Record<string, number>
  limits: Record<string, number | null> | null
}

export interface PlansResponse {
  currencies: string[]
  plans: PlanDefinition[]
  razorpayConfigured: boolean
}

export interface Subscription {
  id: number
  plan_id: number
  provider: string
  status: string
  currency: string
  amount: number
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: number
  started_at: string
  expires_at: string | null
}

export interface Entitlements {
  plan: string
  planName: string
  status: string
  storageBytes: number
  limits: Record<string, number | null>
  features: Record<string, boolean>
}

export interface Usage {
  clients: number
  activeProjects: number
  tasks: number
  invoicesMonthly: number
  videoUploadsMonthly: number
  storageBytes: number
}

export interface BillingPayment {
  id: number
  plan_name: string
  provider: string
  provider_payment_id: string | null
  provider_order_id: string | null
  currency: string
  amount: number
  status: string
  payment_type: string
  paid_at: string | null
  created_at: string
}

export const STORAGE_UNITS: Record<string, { value: number; label: string }[]> = {
  bytes: [
    { value: 1e9, label: "1 GB" },
    { value: 5e9, label: "5 GB" },
    { value: 10e9, label: "10 GB" },
    { value: 15e9, label: "15 GB" },
    { value: 20e9, label: "20 GB" },
    { value: 50e9, label: "50 GB" },
  ],
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function getPlanPrice(plan: PlanDefinition, currency: string): number | null {
  return plan.prices[currency] ?? null
}

export function getIntervalLabel(interval: string | null): string {
  if (!interval) return ""
  return interval.charAt(0).toUpperCase() + interval.slice(1)
}

export interface CouponValidation {
  code: string
  description: string
  discountType: "percent" | "fixed"
  discountValue: number
  originalPrice: number
  discountAmount: number
  finalAmount: number
  currency: string
}

export const billingService = {
  async getPlans(): Promise<PlansResponse> {
    const res = await api.get<{ data: PlansResponse }>("/billing/plans")
    return res.data
  },

  async getSubscription() {
    const res = await api.get<{ data: { subscription: Subscription; plan: PlanDefinition; entitlements: Entitlements } }>("/billing/subscription")
    return res.data
  },

  async getUsage() {
    const res = await api.get<{ data: { usage: Usage; limits: Record<string, number | null>; storageBytes: number } }>("/billing/usage")
    return res.data
  },

  async getPayments(): Promise<BillingPayment[]> {
    const res = await api.get<{ data: BillingPayment[] }>("/billing/payments")
    return res.data
  },

  async validateCoupon(code: string, planSlug: string, currency: string): Promise<CouponValidation> {
    const res = await api.post<{ data: CouponValidation }>("/billing/validate-coupon", { code, plan_slug: planSlug, currency })
    return res.data
  },

  async createOrder(planSlug: string, currency: string, couponCode?: string) {
    const res = await api.post<{ data: { order: any; keyId: string; plan: string; currency: string; amount: number; originalPrice: number; discount: number; couponCode: string | null } }>("/billing/create-order", { plan_slug: planSlug, currency, coupon_code: couponCode || undefined })
    return res.data
  },

  async createSubscription(planSlug: string, currency: string) {
    const res = await api.post<{ data: { subscription: any; keyId: string; plan: string; currency: string; amount: number; originalPrice: number; discount: number; couponCode: string | null } }>("/billing/create-subscription", { plan_slug: planSlug, currency })
    return res.data
  },

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    const res = await api.post<{ data: { paymentId: string; plan: string; status: string; amount: number; currency: string } }>("/billing/verify-payment", {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    })
    return res.data
  },

  async verifySubscription(subscriptionId: string, paymentId: string, signature: string) {
    const res = await api.post<{ data: { paymentId: string; plan: string; status: string } }>("/billing/verify-subscription", {
      razorpay_subscription_id: subscriptionId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    })
    return res.data
  },

  async cancelSubscription(subscriptionId: number) {
    const res = await api.post<{ data: { id: number; cancelAtPeriodEnd: boolean } }>(`/billing/subscription/${subscriptionId}/cancel`)
    return res.data
  },
}
