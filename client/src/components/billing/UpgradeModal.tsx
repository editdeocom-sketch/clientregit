import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Crown, Loader2, X, Tag } from "lucide-react"
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

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message?: string
}

export function UpgradeModal({ open, onOpenChange, message }: UpgradeModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const [plans, setPlans] = useState<PlansResponse | null>(null)
  const [currency, setCurrency] = useState(preferences.currency || "INR")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    billingService.getPlans()
      .then((data) => setPlans(data))
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false))
  }, [open])

  const proPlans = plans?.plans.filter((p) => p.recurring) || []
  const lifetimePlan = plans?.plans.find((p) => p.slug === "lifetime")

  const handleSelectPlan = (plan: PlanDefinition) => {
    onOpenChange(false)
    navigate(`/checkout?plan=${plan.slug}&currency=${currency}`)
  }

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
              const isPopular = plan.slug === "pro_yearly"
              return (
                <div key={plan.slug} className={`flex items-center justify-between p-3 rounded-lg border bg-muted/50 ${isPopular ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                  <div>
                    <p className="font-medium text-foreground text-sm flex items-center gap-2">
                      {plan.name}
                      {isPopular && <Badge className="bg-primary text-primary-foreground text-[10px]">Popular</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {price !== null ? `${formatPrice(price, currency)}/${plan.interval === "monthly" ? "mo" : plan.interval === "quarterly" ? "3 mo" : "yr"}` : "N/A"}
                    </p>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleSelectPlan(plan)} disabled={price === null}>
                    Choose
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
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleSelectPlan(lifetimePlan)} disabled={price === null}>
                    Choose
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
