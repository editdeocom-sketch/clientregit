import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 36, text: "text-xl" },
    lg: { icon: 48, text: "text-2xl" },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={sizes[size].icon}
        height={sizes[size].icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer C ring */}
        <circle cx="22" cy="24" r="18" stroke="#3A506B" strokeWidth="4" fill="none" strokeDasharray="85 28" />
        {/* Person head */}
        <circle cx="18" cy="20" r="5" fill="#5C7A9B" />
        {/* Person body */}
        <path d="M10 34c0-5.5 4-9 8-9s8 3.5 8 9" fill="#5C7A9B" />
        {/* Play triangle */}
        <path d="M32 18l10 6-10 6V18z" fill="#5C7A9B" />
      </svg>
      {showText && (
        <span className={cn("font-bold text-foreground", sizes[size].text)}>
          Client<span className="text-primary">Regit</span>
        </span>
      )}
    </div>
  )
}