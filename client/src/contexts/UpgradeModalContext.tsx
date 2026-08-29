import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { UpgradeModal } from "@/components/billing/UpgradeModal"

interface UpgradeModalContextValue {
  showUpgrade: (message?: string) => void
  hideUpgrade: () => void
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | undefined>(undefined)

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | undefined>()

  const showUpgrade = useCallback((msg?: string) => { setMessage(msg); setOpen(true) }, [])
  const hideUpgrade = useCallback(() => setOpen(false), [])

  return (
    <UpgradeModalContext.Provider value={{ showUpgrade, hideUpgrade }}>
      {children}
      <UpgradeModal open={open} onOpenChange={setOpen} message={message} />
    </UpgradeModalContext.Provider>
  )
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext)
  if (!context) throw new Error("useUpgradeModal must be used within UpgradeModalProvider")
  return context
}
