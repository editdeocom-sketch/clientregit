import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { defaultCountry } from "@/lib/countryData"

export interface Preferences {
  country: string
  currency: string
  currencySymbol: string
  phoneCode: string
}

const defaultPreferences: Preferences = {
  country: defaultCountry?.name || "India",
  currency: defaultCountry?.currency || "INR",
  currencySymbol: defaultCountry?.symbol || "₹",
  phoneCode: defaultCountry?.phoneCode || "+91",
}

// Financial values are stored in INR. These bundled rates keep conversion
// working offline; changing the base currency later requires a data migration.
const INR_RATES: Record<string, number> = {
  INR: 1, USD: 0.0118, EUR: 0.0108, GBP: 0.0093, AED: 0.0433, SAR: 0.0443,
  QAR: 0.0430, KWD: 0.0036, BHD: 0.0044, OMR: 0.0045, JPY: 1.76, CNY: 0.084,
  HKD: 0.092, SGD: 0.0158, MYR: 0.0495, THB: 0.405, IDR: 188, PHP: 0.67,
  BDT: 1.43, PKR: 3.30, NPR: 1.60, LKR: 3.54, AUD: 0.0182, NZD: 0.0198,
  CAD: 0.0161, CHF: 0.0105, SEK: 0.117, NOK: 0.124, DKK: 0.0805, PLN: 0.0465,
  RUB: 0.95, ZAR: 0.213, NGN: 19.0, KES: 1.52, GHS: 0.185, EGP: 0.58,
  TRY: 0.425, BRL: 0.063, MXN: 0.202, ARS: 13.6, CLP: 11.0, COP: 49.5,
  PEN: 0.044, UAH: 0.49, VND: 295, KRW: 15.9, TWD: 0.382, ILS: 0.043,
}

interface PreferencesContextValue {
  preferences: Preferences
  loading: boolean
  updatePreferences: (preferences: Preferences) => Promise<void>
  formatAmount: (amount: number) => string
  fromBaseAmount: (amount: number) => number
  toBaseAmount: (amount: number) => number
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [exchangeRate, setExchangeRate] = useState(INR_RATES[defaultPreferences.currency] || 1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!user) {
      setPreferences(defaultPreferences)
      setLoading(false)
      return
    }
    setLoading(true)
    api.get<{ data: Preferences }>("/auth/preferences")
      .then((response) => {
        if (active && response.data) setPreferences({ ...defaultPreferences, ...response.data })
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    const currency = preferences.currency || "INR"
    setExchangeRate(INR_RATES[currency] || 1)
    if (currency === "INR") return

    let active = true
    api.get<{ data: { rate: number } }>(`/exchange-rate?currency=${encodeURIComponent(currency)}`)
      .then((response) => {
        if (active && Number.isFinite(response.data?.rate) && response.data.rate > 0) setExchangeRate(response.data.rate)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [preferences.currency])

  const updatePreferences = async (next: Preferences) => {
    const response = await api.put<{ data: Preferences }>("/auth/preferences", next)
    setPreferences({ ...defaultPreferences, ...response.data })
  }

  const fromBaseAmount = (amount: number) => (Number.isFinite(amount) ? amount : 0) * exchangeRate
  const toBaseAmount = (amount: number) => (Number.isFinite(amount) ? amount : 0) / exchangeRate

  const formatAmount = (amount: number) => {
    const currency = preferences.currency || "INR"
    const convertedAmount = fromBaseAmount(amount)
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
        minimumFractionDigits: convertedAmount !== 0 && Math.abs(convertedAmount) < 1 ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(convertedAmount)
    } catch {
      return `${preferences.currencySymbol} ${convertedAmount.toFixed(2)}`
    }
  }

  return <PreferencesContext.Provider value={{ preferences, loading, updatePreferences, formatAmount, fromBaseAmount, toBaseAmount }}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider")
  return context
}
