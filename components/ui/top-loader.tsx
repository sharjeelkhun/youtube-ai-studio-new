"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export function TopLoader() {
    const [isLoading, setIsLoading] = useState(false)
    const [showLogo, setShowLogo] = useState(false)
    const [progress, setProgress] = useState(0)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Start loading
        setIsLoading(true)
        setProgress(20)
        setShowLogo(true) // Show immediately

        // Simulate progress - faster jumps
        const timer1 = setTimeout(() => setProgress(45), 50)
        const timer2 = setTimeout(() => setProgress(75), 150)
        const timer3 = setTimeout(() => setProgress(90), 300)

        // Complete loading
        const timer4 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                setIsLoading(false)
                setProgress(0)
                setShowLogo(false)
            }, 100) // Hide faster
        }, 600) // Finish faster

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            clearTimeout(timer4)
        }
    }, [pathname])

    if (!isLoading) return null

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-[9999] h-1.5 bg-background/20 backdrop-blur-sm">
                <motion.div
                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/50"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    style={{
                        boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)"
                    }}
                />
            </div>

            <AnimatePresence>
                {showLogo && (
                    <motion.div
                        className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/40 backdrop-blur-[2px] pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="relative"
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.8, 1, 0.8]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="absolute -inset-8 bg-red-500/20 blur-2xl rounded-full" />
                            <Image
                                src="/brand/logo.png"
                                alt="Loading..."
                                width={80}
                                height={80}
                                className="relative z-10 w-20 h-20 object-contain drop-shadow-2xl"
                                priority
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
