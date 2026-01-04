import type React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
