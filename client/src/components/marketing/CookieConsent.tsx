import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/layout/glass-card";
import { X, Settings } from "lucide-react";

interface CookieConsentData {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: number;
}

const STORAGE_KEY = "clientregit-cookie-consent";

function getStoredConsent(): CookieConsentData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookieConsentData;
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (!stored) {
      setShowBanner(true);
    }

    const handleOpen = () => setShowBanner(true);
    window.addEventListener("open-cookie-consent", handleOpen);
    return () => window.removeEventListener("open-cookie-consent", handleOpen);
  }, []);

  const saveConsent = useCallback((data: CookieConsentData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setConsent(data);
    setShowBanner(false);
  }, []);

  const openBanner = useCallback(() => {
    setShowBanner(true);
  }, []);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  return { consent, showBanner, openBanner, closeBanner, saveConsent };
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-muted"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function CookieConsent() {
  const { consent, showBanner, openBanner, closeBanner, saveConsent } =
    useCookieConsent();

  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    advertising: false,
  });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (consent) {
      setPreferences({
        necessary: true,
        analytics: consent.analytics,
        advertising: consent.advertising,
      });
    }
  }, [consent]);

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      advertising: true,
      timestamp: Date.now(),
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      advertising: false,
      timestamp: Date.now(),
    });
  };

  const handleSavePreferences = () => {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      advertising: preferences.advertising,
      timestamp: Date.now(),
    });
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <GlassCard variant="strong" className="mx-auto max-w-4xl p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Cookie Preferences</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={closeBanner}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            We use cookies to improve your experience on ClientRegit. You can choose which
            categories of cookies you allow. Necessary cookies are always enabled as they are
            essential for the site to function.
          </p>

          {expanded && (
            <div className="space-y-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Necessary</p>
                  <p className="text-xs text-muted-foreground">
                    Required for the site to function properly
                  </p>
                </div>
                <Toggle checked disabled onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Help us understand how visitors interact with the site
                  </p>
                </div>
                <Toggle
                  checked={preferences.analytics}
                  onChange={(val) =>
                    setPreferences((p) => ({ ...p, analytics: val }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Advertising</p>
                  <p className="text-xs text-muted-foreground">
                    Used to deliver personalized advertisements
                  </p>
                </div>
                <Toggle
                  checked={preferences.advertising}
                  onChange={(val) =>
                    setPreferences((p) => ({ ...p, advertising: val }))
                  }
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!expanded && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Customize
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
              onClick={handleRejectAll}
            >
              Reject All
            </Button>
            {expanded && (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
            )}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAcceptAll}
            >
              Accept All
            </Button>
          </div>
        </GlassCard>
      </div>

      <style>{`
        #manage-cookies-trigger {
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
