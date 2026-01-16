import { PremiumLoader } from "./premium-loader"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
    message?: string
    className?: string
}

export function PageLoader({ message, className }: PageLoaderProps) {
    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-background/80 backdrop-blur-sm",
            "animate-in fade-in duration-300",
            className
        )}>
            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                {/* Logo/Brand Animation */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20">
                        <PremiumLoader variant="spinner" size="lg" color="text-primary" />
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-sm font-medium text-foreground/80">{message}</p>
                        <div className="flex items-center justify-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
                            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
