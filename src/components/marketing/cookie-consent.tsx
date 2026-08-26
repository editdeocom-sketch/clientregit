"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/layout/glass-card"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("clientregit-cookie-consent")
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("clientregit-cookie-consent", "accepted")
    setVisible(false)
  }

  const handleManage = () => {
    localStorage.setItem("clientregit-cookie-consent", "managed")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <GlassCard variant="strong" className="mx-auto max-w-4xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground/80 leading-relaxed">
              We use cookies to improve ClientRegit&apos;s experience and understand
              how people use our website.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
              onClick={handleManage}
            >
              Manage Preferences
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAccept}
            >
              Accept
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
