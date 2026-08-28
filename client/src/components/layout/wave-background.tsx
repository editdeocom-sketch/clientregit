import { cn } from "@/lib/utils"

export function WaveBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <svg className="w-full h-full opacity-20" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3A506B" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#5C7A9B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3A506B" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 C200,150 400,250 600,200 C800,150 1000,250 1200,200 L1200,400 L0,400 Z"
          fill="url(#waveGradient)"
        >
          <animate
            attributeName="d"
            values={
              "M0,200 C200,150 400,250 600,200 C800,150 1000,250 1200,200 L1200,400 L0,400 Z;" +
              "M0,220 C200,170 400,270 600,220 C800,170 1000,270 1200,220 L1200,400 L0,400 Z;" +
              "M0,200 C200,150 400,250 600,200 C800,150 1000,250 1200,200 L1200,400 L0,400 Z"
            }
            dur="20s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M0,250 C200,200 400,300 600,250 C800,200 1000,300 1200,250 L1200,400 L0,400 Z"
          fill="url(#waveGradient)"
          opacity="0.5"
        >
          <animate
            attributeName="d"
            values={
              "M0,250 C200,200 400,300 600,250 C800,200 1000,300 1200,250 L1200,400 L0,400 Z;" +
              "M0,270 C200,220 400,320 600,270 C800,220 1000,320 1200,270 L1200,400 L0,400 Z;" +
              "M0,250 C200,200 400,300 600,250 C800,200 1000,300 1200,250 L1200,400 L0,400 Z"
            }
            dur="25s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  )
}
