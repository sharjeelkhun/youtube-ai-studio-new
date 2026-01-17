"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
    className?: string
    size?: number
    showText?: boolean
    textClassName?: string
}

export function BrandLogo({
    className,
    size = 32,
    showText = false,
    textClassName
}: BrandLogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className="relative flex items-center justify-center"
                style={{ width: size * 1.48, height: size }}
            >
                <Image
                    src="/brand/logo.png"
                    alt="YourAI Studio"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {showText && (
                <span className={cn("font-bold tracking-tight", textClassName)}>
                    YourAI Studio
                </span>
            )}
        </div>
    )
}
