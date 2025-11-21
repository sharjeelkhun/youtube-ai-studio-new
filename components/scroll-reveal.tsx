'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode, useEffect, useState } from 'react'

// Hook to detect scroll direction
function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down')
    const lastScrollY = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > lastScrollY.current) {
                setScrollDirection('down')
            } else if (currentScrollY < lastScrollY.current) {
                setScrollDirection('up')
            }
            lastScrollY.current = currentScrollY
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return scrollDirection
}

interface ScrollRevealProps {
    children: ReactNode
    delay?: number
    className?: string
}

export function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: false, margin: "-100px", amount: 0.3 })
    const scrollDirection = useScrollDirection()

    // Determine animation state based on scroll direction
    const isScrollingDown = scrollDirection === 'down'
    const shouldAnimate = isInView && isScrollingDown

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 1, scale: 1 }}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
            transition={{
                duration: 0.6,
                delay: shouldAnimate ? delay : 0,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface ScrollFadeProps {
    children: ReactNode
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right'
    className?: string
}

export function ScrollFade({ children, delay = 0, direction = 'up', className = '' }: ScrollFadeProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: false, margin: "-100px", amount: 0.3 })
    const scrollDirection = useScrollDirection()

    // Determine animation state based on scroll direction
    const isScrollingDown = scrollDirection === 'down'
    const shouldAnimate = isInView && isScrollingDown

    const directionOffset = {
        up: { y: 40 },
        down: { y: -40 },
        left: { x: 40 },
        right: { x: -40 }
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 1, y: 0, x: 0 }}
            animate={shouldAnimate ? { opacity: 1, y: 0, x: 0 } : { opacity: 1, ...directionOffset[direction] }}
            transition={{
                duration: 0.6,
                delay: shouldAnimate ? delay : 0,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
