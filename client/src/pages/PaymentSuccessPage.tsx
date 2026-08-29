import { useSearchParams, Link } from "react-router-dom"
import { CheckCircle, ArrowRight, Crown, Zap, Infinity } from "lucide-react"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"

const PLAN_DISPLAY: Record<string, { name: string; icon: typeof CheckCircle }> = {
  pro_monthly: { name: "Pro Monthly", icon: Crown },
  pro_quarterly: { name: "Pro Quarterly", icon: Crown },
  pro_yearly: { name: "Pro Yearly", icon: Crown },
  lifetime: { name: "Lifetime", icon: Infinity },
}

export default function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const plan = params.get("plan") || "pro"
  const amount = params.get("amount")
  const currency = params.get("currency")
  const paymentId = params.get("payment_id")
  const status = params.get("status") || "active"

  const planInfo = PLAN_DISPLAY[plan] || { name: plan, icon: Crown }
  const PlanIcon = planInfo.icon

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={false} />
            <span className="ml-2 text-xl font-bold text-foreground">Client<span className="text-muted-foreground">Regit</span></span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful</h1>
          <p className="text-muted-foreground mb-6">Your plan has been activated.</p>

          <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5"><PlanIcon className="h-4 w-4 text-primary" />{planInfo.name}</span>
            </div>
            {amount && currency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium text-foreground">{currency} {amount}</span>
              </div>
            )}
            {paymentId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment ID</span>
                <span className="text-xs font-mono text-muted-foreground">{paymentId}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 capitalize">{status}</span>
            </div>
          </div>

          <Link to="/dashboard" className="block">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Continue to ClientRegit <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
