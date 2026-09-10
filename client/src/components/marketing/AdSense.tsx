import { useEffect, useRef } from "react";

interface AdSenseProps {
  className?: string;
  slot: string;
  format?: string;
  responsive?: boolean;
}

const ADSENSE_ENABLED = import.meta.env.VITE_GOOGLE_ADSENSE_ENABLED === "true";
const ADSENSE_CLIENT_ID = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || "";

let scriptLoaded = false;

function loadAdSenseScript(clientId: string) {
  if (scriptLoaded || !clientId) return;

  const existing = document.querySelector(
    `script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
  );
  if (existing) {
    scriptLoaded = true;
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
  scriptLoaded = true;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdSense({
  className = "",
  slot,
  format = "auto",
  responsive = true,
}: AdSenseProps) {
  const containerRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!ADSENSE_ENABLED || !ADSENSE_CLIENT_ID) return;

    loadAdSenseScript(ADSENSE_CLIENT_ID);

    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle as unknown[]).push({});
      }
    } catch {
      // AdSense not ready yet
    }
  }, []);

  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground text-xs ${className}`}
        style={{ minHeight: responsive ? "250px" : "90px" }}
      >
        Ad Placeholder
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        ref={containerRef}
      />
    </div>
  );
}
