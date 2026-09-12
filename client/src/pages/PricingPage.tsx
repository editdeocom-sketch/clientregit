import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, Crown, Zap, AlertCircle } from "lucide-react"
import { GlassCard } from "@/components/layout/glass-card"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { billingService, type PlanDefinition, type PlansResponse, type Entitlements, formatBytes, getPlanPrice } from "@/services/billingService"
import { useAuth } from "@/contexts/AuthContext"
import { usePreferences } from "@/contexts/PreferencesContext"
import { PageLoader } from "@/components/ui/page-loader"
import { MarketingFooter } from "@/components/marketing/footer"

const CURRENCY_LABELS: Record<string, { symbol: string; name: string; flag: string }> = {
  INR: { symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  USD: { symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  GBP: { symbol: "£", name: "British Pound", flag: "🇬🇧" },
  EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
  AED: { symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  AUD: { symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  CAD: { symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  SGD: { symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar", flag: "🇳🇿" },
  JPY: { symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  KRW: { symbol: "₩", name: "Korean Won", flag: "🇰🇷" },
  SAR: { symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  BRL: { symbol: "R$", name: "Brazilian Real", flag: "🇧🇷" },
  MXN: { symbol: "Mex$", name: "Mexican Peso", flag: "🇲🇽" },
}

function detectInitialCurrency(savedCurrency?: string): string {
  if (savedCurrency) return savedCurrency
  const stored = localStorage.getItem("billing_currency")
  if (stored) return stored
  const locale = navigator.language || navigator.languages?.[0] || ""
  const localeUpper = locale.toUpperCase()
  if (localeUpper.startsWith("EN-IN") || localeUpper === "IN") return "INR"
  if (localeUpper.startsWith("EN-GB") || localeUpper === "GB") return "GBP"
  if (localeUpper.startsWith("DE") || localeUpper.startsWith("FR") || localeUpper.startsWith("IT") || localeUpper.startsWith("ES") || localeUpper.startsWith("NL") || localeUpper.startsWith("IE") || localeUpper.startsWith("PT")) return "EUR"
  if (localeUpper.startsWith("EN-AU")) return "AUD"
  if (localeUpper.startsWith("EN-CA") || localeUpper.startsWith("FR-CA")) return "CAD"
  if (localeUpper.startsWith("EN-SG")) return "SGD"
  if (localeUpper.startsWith("EN-NZ")) return "NZD"
  if (localeUpper.startsWith("JA") || localeUpper === "JP") return "JPY"
  if (localeUpper.startsWith("KO") || localeUpper === "KR") return "KRW"
  if (localeUpper.startsWith("PT-BR")) return "BRL"
  if (localeUpper.startsWith("ES-MX")) return "MXN"
  if (localeUpper.startsWith("AR-AE")) return "AED"
  if (localeUpper.startsWith("AR-SA")) return "SAR"
  return "USD"
}

function formatPrice(amount: number, currency: string): string {
  const info = CURRENCY_LABELS[currency]
  const symbol = info?.symbol || currency
  const decimals = ["JPY", "KRW"].includes(currency) ? 0 : 2
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

const PLAN_ICONS: Record<string, typeof Check> = {
  free: Zap,
  pro_monthly: Crown,
  pro_quarterly: Crown,
  pro_yearly: Crown,
}

const FEATURE_LIST = [
  { label: "Clients", free: "3", pro: "Unlimited" },
  { label: "Active Projects", free: "10", pro: "Unlimited" },
  { label: "Tasks", free: "10", pro: "Unlimited" },
  { label: "Invoices / month", free: "3", pro: "Unlimited" },
  { label: "Video Uploads / month", free: "5", pro: "Unlimited" },
  { label: "Storage", free: "1 GB", pro: "15 GB" },
  { label: "Professional Invoices", free: false, pro: true },
  { label: "Custom Branding", free: false, pro: true },
  { label: "Advanced Dashboard", free: false, pro: true },
  { label: "CSV Export", free: false, pro: true },
  { label: "Client Portal", free: false, pro: true },
  { label: "Shareable Video Links", free: false, pro: true },
  { label: "Multiple Video Versions", free: false, pro: true },
  { label: "Advanced Reports", free: false, pro: true },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const [plans, setPlans] = useState<PlansResponse | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Entitlements | null>(null)
  const [currency, setCurrency] = useState(() => detectInitialCurrency(preferences.currency))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    billingService.getPlans()
      .then((data) => setPlans(data))
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    billingService.getSubscription()
      .then((data) => setCurrentPlan(data.entitlements))
      .catch(() => undefined)
  }, [user])

  const handleSelectPlan = (plan: PlanDefinition) => {
    if (!user) { navigate("/signup"); return }
    if (plan.slug === "free") { toast.info("You're already on the Free plan"); return }
    localStorage.setItem("billing_currency", currency)
    navigate(`/checkout?plan=${plan.slug}&currency=${currency}`)
  }

  const displayPlans = plans?.plans.filter((p) => p.slug !== "free") || []
  const freePlan = plans?.plans.find((p) => p.slug === "free")

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={false} />
            <span className="ml-2 text-xl font-bold text-foreground">Client<span className="text-muted-foreground">Regit</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard"><Button variant="ghost" className="text-muted-foreground hover:text-foreground">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" className="text-muted-foreground hover:text-foreground">Login</Button></Link>
                <Link to="/signup"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">Start for free. Upgrade when you need more power.</p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-sm text-muted-foreground">Currency:</span>
            <Select value={currency} onValueChange={(c) => { setCurrency(c); localStorage.setItem("billing_currency", c) }}>
              <SelectTrigger className="w-[220px] bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(plans?.currencies || []).map((c) => (
                  <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]?.flag} {c} — {CURRENCY_LABELS[c]?.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free Plan */}
            {freePlan && (
              <GlassCard variant="subtle" className="p-6 flex flex-col">
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3"><Zap className="h-5 w-5 text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold">{freePlan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold">Free</span>
                    <span className="text-muted-foreground">forever</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-muted-foreground" />3 clients</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-muted-foreground" />10 active projects</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-muted-foreground" />10 tasks</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-muted-foreground" />3 invoices/month</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-muted-foreground" />5 video uploads/month</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-muted-foreground" />1 GB storage</li>
                </ul>
                {currentPlan?.plan === "free" ? (
                  <Button className="w-full bg-muted text-foreground" disabled>Current Plan</Button>
                ) : user ? (
                  <Button className="w-full bg-muted text-foreground" disabled>You're on Free</Button>
                ) : (
                  <Link to="/signup" className="block"><Button className="w-full bg-muted text-foreground hover:bg-muted/80">Get Started</Button></Link>
                )}
              </GlassCard>
            )}

            {/* Pro Plans */}
            {displayPlans.map((plan) => {
              const Icon = PLAN_ICONS[plan.slug] || Crown
              const price = getPlanPrice(plan, currency)
              const isCurrent = currentPlan?.plan === plan.slug
              const isPopular = plan.slug === "pro_yearly"
              const isBestValue = plan.slug === "pro_quarterly"

              return (
                <GlassCard
                  key={plan.slug}
                  variant={isPopular ? "default" : "subtle"}
                  className={`p-6 flex flex-col relative ${isPopular ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}`}
                >
                  {isPopular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>}
                  {isBestValue && <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">Best Value</Badge>}
                  <div className="mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-primary/10`}>
                      <Icon className="h-5 w-5 text-primary/80" />
                    </div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2 min-h-[40px]">
                      {price !== null ? (
                        <>
                          <span className="text-4xl font-bold">{formatPrice(price, currency)}</span>
                          <span className="text-muted-foreground">/{plan.interval === "monthly" ? "mo" : plan.interval === "quarterly" ? "3 mo" : "yr"}</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Unlimited clients</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Unlimited projects</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Unlimited tasks</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Unlimited invoices</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Unlimited video uploads</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />{formatBytes(plan.storageBytes)} storage</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Professional invoices</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Custom branding</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Advanced dashboard</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />CSV export</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Client portal</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />Shareable video links</li>
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full bg-primary/20 text-primary" disabled>Current Plan</Button>
                  ) : price === null ? (
                    <Button className="w-full bg-muted text-foreground" disabled>Not available in {currency}</Button>
                  ) : (
                    <Button
                      className={`w-full ${isPopular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-muted/80"}`}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isPopular ? "Choose Yearly" : isBestValue ? "Choose Quarterly" : "Start Pro"}
                    </Button>
                  )}
                </GlassCard>
              )
            })}
          </div>

          {!plans?.razorpayConfigured && (
            <GlassCard variant="subtle" className="mt-8 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">Payment processing is not configured yet. Set up Razorpay credentials to enable checkout.</p>
            </GlassCard>
          )}
        </div>
      </section>

      {/* Compare Features */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Compare all features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-primary font-medium">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_LIST.map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-3 px-4 text-foreground">{row.label}</td>
                    {(["free", "pro"] as const).map((tier) => {
                      const val = row[tier]
                      return (
                        <td key={tier} className="py-3 px-4 text-center">
                          {typeof val === "boolean" ? (
                            val ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={tier === "free" ? "text-muted-foreground" : "text-foreground"}>{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
