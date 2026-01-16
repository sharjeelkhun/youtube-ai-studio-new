"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function TopLoader() {
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Start loading
        setIsLoading(true)
        setProgress(20)

        // Simulate progress
        const timer1 = setTimeout(() => setProgress(40), 100)
        const timer2 = setTimeout(() => setProgress(60), 300)
        const timer3 = setTimeout(() => setProgress(80), 600)

        // Complete loading
        const timer4 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                setIsLoading(false)
                setProgress(0)
            }, 200)
        }, 1000)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            clearTimeout(timer4)
        }
    }, [pathname, searchParams])

    if (!isLoading) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1">
            <div
                className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 transition-all duration-300 ease-out shadow-lg shadow-red-500/50"
                style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)"
                }}
            />
        </div>
    )
}
