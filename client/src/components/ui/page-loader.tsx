export function PageLoader({ className = "min-h-screen" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/40" />
          <div className="absolute inset-[14px] animate-pulse rounded-full bg-gradient-to-br from-primary to-cyan-400" />
        </div>
        <p className="flex items-center text-sm font-medium text-muted-foreground">
          Loading
          <span className="loader-dots">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    </div>
  )
}