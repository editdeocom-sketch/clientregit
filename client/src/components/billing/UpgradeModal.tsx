import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { Check, Crown, Zap, Loader2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { billingService, type PlanDefinition, type PlansResponse, formatBytes, getPlanPrice } from "@/services/billingService"
import { useAuth } from "@/contexts/AuthContext"
import { usePreferences } from "@/contexts/PreferencesContext"

const CURRENCY_FLAGS: Record<string, string> = {
  INR: "🇮🇳", USD: "🇺🇸", GBP: "🇬🇧", EUR: "🇪🇺", AED: "🇦🇪", AUD: "🇦🇺",
  CAD: "🇨🇦", SGD: "🇸🇬", NZD: "🇳🇿", JPY: "🇯🇵", KRW: "🇰🇷", SAR: "🇸🇦",
  BRL: "🇧🇷", MXN: "🇲🇽",
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", EUR: "€", AED: "د.إ", AUD: "A$",
  CAD: "C$", SGD: "S$", NZD: "NZ$", JPY: "¥", KRW: "₩", SAR: "﷼",
  BRL: "R$", MXN: "Mex$",
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

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message?: string
}

export function UpgradeModal({ open, onOpenChange, message }: UpgradeModalProps) {
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const [plans, setPlans] = useState<PlansResponse | null>(null)
  const [currency, setCurrency] = useState(preferences.currency || "INR")
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    billingService.getPlans()
      .then((data) => { setPlans(data); if (data.razorpayConfigured) loadRazorpayScript().then(setScriptLoaded) })
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false))
  }, [open])

  const proPlans = plans?.plans.filter((p) => p.recurring) || []
  const lifetimePlan = plans?.plans.find((p) => p.slug === "lifetime")

  const handlePurchase = useCallback(async (plan: PlanDefinition) => {
    if (!user) { window.location.href = "/signup"; return }
    const price = getPlanPrice(plan, currency)
    if (price === null) { toast.error(`Not available in ${currency}`); return }
    if (!scriptLoaded || !plans?.razorpayConfigured) { toast.error("Payments not configured yet."); return }

    setPurchasing(plan.slug)
    try {
      if (plan.recurring) {
        const subData = await billingService.createSubscription(plan.slug, currency)
        const rzp = new (window as any).Razorpay({ key: subData.keyId, subscription_id: subData.subscription.id, name: "ClientRegit", description: plan.name, handler: async (response: any) => {
          try {
            await billingService.verifySubscription(subData.subscription.id, response.razorpay_payment_id, response.razorpay_signature)
            window.location.href = `/payment-success?plan=${plan.slug}&currency=${currency}&payment_id=${response.razorpay_payment_id}&status=active`
          } catch { toast.error("Verification failed. Contact support.") }
        }, prefill: { email: user.email }, theme: { color: "#6366f1" }, modal: { ondismiss: () => setPurchasing(null) } })
        rzp.open()
      } else {
        const orderData = await billingService.createOrder(plan.slug, currency)
        const rzp = new (window as any).Razorpay({ key: orderData.keyId, amount: orderData.amount * (["JPY", "KRW"].includes(currency) ? 1 : 100), currency, name: "ClientRegit", description: plan.name, order_id: orderData.order.id, handler: async (response: any) => {
          try {
            await billingService.verifyPayment(orderData.order.id, response.razorpay_payment_id, response.razorpay_signature)
            window.location.href = `/payment-success?plan=${plan.slug}&currency=${currency}&amount=${orderData.amount}&payment_id=${response.razorpay_payment_id}&status=active`
          } catch { toast.error("Verification failed. Contact support.") }
        }, prefill: { email: user.email }, theme: { color: "#6366f1" }, modal: { ondismiss: () => setPurchasing(null) } })
        rzp.open()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout")
    } finally { setPurchasing(null) }
  }, [user, currency, scriptLoaded, plans, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          {message && <DialogDescription>{message}</DialogDescription>}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[160px] bg-muted border-border h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(plans?.currencies || []).map((c) => (
                    <SelectItem key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {proPlans.map((plan) => {
              const price = getPlanPrice(plan, currency)
              return (
                <div key={plan.slug} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {price !== null ? `${formatPrice(price, currency)}/${plan.interval === "monthly" ? "mo" : plan.interval === "quarterly" ? "3 mo" : "yr"}` : "N/A"}
                    </p>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handlePurchase(plan)} disabled={purchasing === plan.slug || price === null}>
                    {purchasing === plan.slug ? <Loader2 className="h-3 w-3 animate-spin" /> : "Choose"}
                  </Button>
                </div>
              )
            })}

            {lifetimePlan && (() => {
              const price = getPlanPrice(lifetimePlan, currency)
              return (
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div>
                    <p className="font-medium text-foreground text-sm flex items-center gap-1.5">Lifetime <Badge variant="secondary" className="text-[10px]">Best Value</Badge></p>
                    <p className="text-xs text-muted-foreground">{price !== null ? `${formatPrice(price, currency)} one-time` : "N/A"}</p>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handlePurchase(lifetimePlan)} disabled={purchasing === lifetimePlan.slug || price === null}>
                    {purchasing === lifetimePlan.slug ? <Loader2 className="h-3 w-3 animate-spin" /> : "Choose"}
                  </Button>
                </div>
              )
            })()}

            <Link to="/pricing" className="block text-center">
              <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
                View all plans and features
              </Button>
            </Link>
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
