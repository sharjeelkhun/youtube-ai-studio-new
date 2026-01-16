import { cn } from "@/lib/utils"

interface PremiumLoaderProps {
  variant?: "spinner" | "pulse" | "dots" | "bars"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  color?: string
}

export function PremiumLoader({
  variant = "spinner",
  size = "md",
  className,
  color = "text-primary"
}: PremiumLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  if (variant === "spinner") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin",
          color
        )} />
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent border-r-current animate-spin",
          color,
          "opacity-30"
        )} style={{ animationDuration: "1.5s" }} />
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
        <div className={cn(
          "rounded-full animate-pulse",
          color,
          "bg-current opacity-75",
          sizeClasses[size]
        )} />
      </div>
    )
  }

  if (variant === "dots") {
    const dotSize = {
      sm: "w-1.5 h-1.5",
      md: "w-2.5 h-2.5",
      lg: "w-3.5 h-3.5",
      xl: "w-4 h-4"
    }

    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-current animate-bounce",
              color,
              dotSize[size]
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.6s"
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === "bars") {
    const barHeight = {
      sm: "h-3",
      md: "h-5",
      lg: "h-7",
      xl: "h-9"
    }

    const barWidth = {
      sm: "w-0.5",
      md: "w-1",
      lg: "w-1.5",
      xl: "w-2"
    }

    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-current rounded-full",
              color,
              barWidth[size]
            )}
            style={{
              animation: "pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
              height: "100%",
              maxHeight: barHeight[size].replace("h-", "") + "rem"
            }}
          />
        ))}
      </div>
    )
  }

  return null
}
