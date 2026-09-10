import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle" | "ghost"
}

export function GlassCard({
  className,
  variant = "default",
  children,
  ...props
}: GlassCardProps) {
  const variants = {
    default: "bg-card border border-border shadow-sm",
    strong: "bg-card border border-border shadow-md",
    subtle: "bg-muted/40 border border-border/60",
    ghost: "bg-transparent border border-transparent",
  }

  return (
    <div
      className={cn(
        "rounded-lg",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}