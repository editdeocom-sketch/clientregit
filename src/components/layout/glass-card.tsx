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
    default: "bg-white/5 backdrop-blur-md border border-white/10",
    strong: "bg-white/10 backdrop-blur-lg border border-white/20",
    subtle: "bg-white/3 backdrop-blur-sm border border-white/5",
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