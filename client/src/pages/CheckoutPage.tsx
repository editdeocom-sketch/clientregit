import { useState, useEffect, useCallback } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Tag, X, Loader2, Shield, Check, CreditCard, Crown, Infinity, Zap, Lock } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { billingService, type PlanDefinition, type PlansResponse, type CouponValidation, formatBytes, getPlanPrice } from "@/services/billingService"
import { useAuth } from "@/contexts/AuthContext"
import { usePreferences } from "@/contexts/PreferencesContext"
import { MarketingFooter } from "@/components/marketing/footer"

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", EUR: "€", AED: "د.إ", AUD: "A$",
  CAD: "C$", SGD: "S$", NZD: "NZ$", JPY: "¥", KRW: "₩", SAR: "﷼",
  BRL: "R$", MXN: "Mex$",
}

const CURRENCY_FLAGS: Record<string, string> = {
  INR: "🇮🇳", USD: "🇺🇸", GBP: "🇬🇧", EUR: "🇪🇺", AED: "🇦🇪", AUD: "🇦🇺",
  CAD: "🇨🇦", SGD: "🇸🇬", NZD: "🇳🇿", JPY: "🇯🇵", KRW: "🇰🇷", SAR: "🇸🇦",
  BRL: "🇧🇷", MXN: "🇲🇽",
}

function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const decimals = ["JPY", "KRW"].includes(currency) ? 0 : 2
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return }
    const script = document.createElement("script")
    script.id = "razorpay-script"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const PLAN_FEATURES: Record<string, string[]> = {
  pro_monthly: ["Unlimited clients", "Unlimited projects", "Unlimited tasks", "15 GB video storage", "Professional invoices", "Custom branding", "Advanced dashboard", "Client portal"],
  pro_quarterly: ["Unlimited clients", "Unlimited projects", "Unlimited tasks", "15 GB video storage", "Professional invoices", "Custom branding", "Advanced dashboard", "Client portal"],
  pro_yearly: ["Everything in Pro Monthly", "15 GB video storage", "CSV export", "Shareable video links", "Multiple video versions", "Advanced reports", "Priority support"],
  lifetime: ["Everything in Pro", "50 GB storage", "No recurring payments", "Lifetime updates", "All future features"],
}

const PLAN_INTERVALS: Record<string, string> = {
  monthly: "per month",
  quarterly: "every 3 months",
  yearly: "per year",
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { preferences } = usePreferences()

  const planSlug = searchParams.get("plan") || ""
  const urlCurrency = searchParams.get("currency") || ""

  const [plans, setPlans] = useState<PlansResponse | null>(null)
  const [currency, setCurrency] = useState(urlCurrency || preferences.currency || "INR")
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  useEffect(() => {
    if (!planSlug) { navigate("/pricing"); return }
    billingService.getPlans()
      .then((data) => {
        setPlans(data)
        if (data.razorpayConfigured) loadRazorpayScript().then(setScriptLoaded)
      })
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false))
  }, [planSlug, navigate])

  const plan = plans?.plans.find((p) => p.slug === planSlug)
  const price = plan ? getPlanPrice(plan, currency) : null
  const isRecurring = plan?.recurring
  const features = PLAN_FEATURES[planSlug] || []

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim() || !plan) return
    setCouponLoading(true)
    try {
      const result = await billingService.validateCoupon(couponCode, plan.slug, currency)
      setAppliedCoupon(result)
      toast.success(`Coupon applied! ${result.discountType === "percent" ? `${result.discountValue}% off` : `${result.discountAmount} off`}`)
    } catch (err: any) {
      setAppliedCoupon(null)
      toast.error(err.message || "Invalid coupon")
    } finally { setCouponLoading(false) }
  }, [couponCode, currency, plan])

  const finalPrice = price !== null && appliedCoupon
    ? Math.max(0, price - (appliedCoupon.discountType === "percent" ? Math.round(price * appliedCoupon.discountValue / 100) : Math.min(appliedCoupon.discountValue, price)))
    : price

  const handlePayment = useCallback(async () => {
    if (!user || !plan || price === null) return
    if (!scriptLoaded || !plans?.razorpayConfigured) { toast.error("Payments are not configured yet."); return }

    setPurchasing(true)
    try {
      if (isRecurring) {
        const subData = await billingService.createSubscription(plan.slug, currency)
        const rzp = new (window as any).Razorpay({
          key: subData.keyId,
          subscription_id: subData.subscription.id,
          name: "ClientRegit",
          description: plan.name,
          handler: async (response: any) => {
            try {
              await billingService.verifySubscription(subData.subscription.id, response.razorpay_payment_id, response.razorpay_signature)
              navigate(`/payment-success?plan=${plan.slug}`)
            } catch { toast.error("Payment verification failed. Contact support.") }
          },
          prefill: { name: user.name || "", email: user.email, contact: user.phone || "" },
          theme: { color: "#6366f1" },
          modal: { ondismiss: () => setPurchasing(false) },
        })
        rzp.open()
      } else {
        const orderData = await billingService.createOrder(plan.slug, currency, appliedCoupon?.code || undefined)
        const rzp = new (window as any).Razorpay({
          key: orderData.keyId,
          amount: orderData.amount * (["JPY", "KRW"].includes(currency) ? 1 : 100),
          currency,
          name: "ClientRegit",
          description: plan.name,
          order_id: orderData.order.id,
          handler: async (response: any) => {
            try {
              await billingService.verifyPayment(orderData.order.id, response.razorpay_payment_id, response.razorpay_signature)
              navigate(`/payment-success?plan=${plan.slug}`)
            } catch { toast.error("Payment verification failed. Contact support.") }
          },
          prefill: { name: user.name || "", email: user.email, contact: user.phone || "" },
          theme: { color: "#6366f1" },
          modal: { ondismiss: () => setPurchasing(false) },
        })
        rzp.open()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout")
    } finally { setPurchasing(false) }
  }, [user, plan, price, currency, scriptLoaded, plans, appliedCoupon, isRecurring, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!plan || price === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Plan not found</p>
        <Button variant="outline" onClick={() => navigate("/pricing")}>Back to Pricing</Button>
      </div>
    )
  }

  const PlanIcon = planSlug === "lifetime" ? Infinity : Crown

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={false} />
            <span className="ml-2 text-xl font-bold text-foreground">Client<span className="text-muted-foreground">Regit</span></span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Back button */}
          <button onClick={() => navigate("/pricing")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-3 space-y-6">
              {/* User Details */}
              <GlassCard variant="subtle" className="p-6">
                <h2 className="text-lg font-semibold mb-4">Account Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Plan Details */}
              <GlassCard variant="subtle" className="p-6">
                <h2 className="text-lg font-semibold mb-4">Plan Details</h2>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PlanIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      {planSlug === "pro_yearly" && <Badge className="bg-primary text-primary-foreground text-[10px]">Popular</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRecurring
                        ? `Billed ${PLAN_INTERVALS[plan.interval || "monthly"]}`
                        : "One-time payment, lifetime access"
                      }
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {features.slice(0, 5).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {features.length > 5 && (
                        <li className="text-xs text-primary pl-5">+ {features.length - 5} more features</li>
                      )}
                    </ul>
                  </div>
                </div>
              </GlassCard>

              {/* Currency Selector */}
              <GlassCard variant="subtle" className="p-6">
                <h2 className="text-lg font-semibold mb-4">Currency</h2>
                <div className="flex flex-wrap gap-2">
                  {(plans?.currencies || []).slice(0, 8).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCurrency(c); setAppliedCoupon(null) }}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${currency === c ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border"}`}
                    >
                      {CURRENCY_FLAGS[c]} {c}
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-28">
                <GlassCard variant="subtle" className="p-6">
                  <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      {appliedCoupon && finalPrice !== null && finalPrice < price! ? (
                        <>
                          <span className="text-3xl font-bold text-primary">{formatPrice(finalPrice, currency)}</span>
                          <span className="text-lg text-muted-foreground line-through">{formatPrice(price!, currency)}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold">{formatPrice(price!, currency)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRecurring ? `Billed ${PLAN_INTERVALS[plan.interval || "monthly"]}` : "One-time payment"}
                    </p>
                  </div>

                  {/* Coupon */}
                  {!isRecurring && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-foreground mb-2">Promo Code</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={appliedCoupon ? appliedCoupon.code : couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setAppliedCoupon(null) }}
                          disabled={!!appliedCoupon}
                          className="h-10 w-full rounded-lg bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        />
                      </div>
                      {appliedCoupon ? (
                        <Button variant="ghost" size="sm" className="h-10 px-3 text-destructive hover:text-destructive" onClick={() => { setAppliedCoupon(null); setCouponCode("") }}>
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-10 px-4" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {appliedCoupon.description} — {formatPrice(appliedCoupon.discountAmount, currency)} off
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Breakdown */}
                  <div className="border-t border-border pt-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{plan.name}</span>
                      <span className="text-foreground">{formatPrice(price!, currency)}</span>
                    </div>
                    {appliedCoupon && finalPrice !== null && finalPrice < price! && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">Discount ({appliedCoupon.code})</span>
                        <span className="text-green-600 dark:text-green-400">-{formatPrice(appliedCoupon.discountAmount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(finalPrice || price!, currency)}</span>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <Button
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
                    onClick={handlePayment}
                    disabled={purchasing || !scriptLoaded || !plans?.razorpayConfigured}
                  >
                    {purchasing ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing...</>
                    ) : (
                      <><CreditCard className="h-5 w-5 mr-2" /> Pay {formatPrice(finalPrice || price!, currency)}</>
                    )}
                  </Button>

                  {/* Trust badges */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure by Razorpay</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  )
}
