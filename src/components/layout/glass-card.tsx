import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle"
}

export function GlassCard({
  className,
  variant = "default",
  children,
  ...props
}: GlassCardProps) {
  const variants = {
    default: "bg-card/80 backdrop-blur-md border border-border",
    strong: "bg-card backdrop-blur-lg border border-border",
    subtle: "bg-card/50 backdrop-blur-sm border border-border/50",
  }

  return (
    <div
      className={cn(
        "rounded-xl",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}