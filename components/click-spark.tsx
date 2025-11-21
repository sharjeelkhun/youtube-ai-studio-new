"use client"

import { useEffect, useState } from "react"

interface Spark {
    id: number
    x: number
    y: number
    angle: number
    color: string
    velocity: number
    size: number
}

const colors = [
    "#FF6B9D", // Pink
    "#C084FC", // Purple
    "#60A5FA", // Blue
    "#34D399", // Green
    "#FBBF24", // Yellow
    "#F87171", // Red
]

export default function ClickSpark() {
    const [sparks, setSparks] = useState<Spark[]>([])

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newSparks: Spark[] = []
            const sparkCount = 12 // More particles for a fuller effect

            for (let i = 0; i < sparkCount; i++) {
                newSparks.push({
                    id: Date.now() + i,
                    x: e.clientX,
                    y: e.clientY,
                    angle: (360 / sparkCount) * i + Math.random() * 10 - 5, // Add slight randomness
                    color: colors[Math.floor(Math.random() * colors.length)],
                    velocity: 40 + Math.random() * 20, // Random velocity between 40-60px
                    size: 4 + Math.random() * 4, // Random size between 4-8px
                })
            }

            setSparks(prev => [...prev, ...newSparks])

            setTimeout(() => {
                setSparks(prev => prev.filter(spark => !newSparks.find(s => s.id === spark.id)))
            }, 1000)
        }

        window.addEventListener("click", handleClick)
        return () => window.removeEventListener("click", handleClick)
    }, [])

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            {sparks.map(spark => (
                <div
                    key={spark.id}
                    className="absolute rounded-full animate-[spark_1s_ease-out_forwards]"
                    style={{
                        left: spark.x,
                        top: spark.y,
                        width: `${spark.size}px`,
                        height: `${spark.size}px`,
                        backgroundColor: spark.color,
                        boxShadow: `0 0 ${spark.size * 2}px ${spark.color}`,
                        "--spark-velocity": `${spark.velocity}px`,
                        "--spark-angle": `${spark.angle}deg`,
                    } as React.CSSProperties & { "--spark-velocity": string; "--spark-angle": string }}
                />
            ))}
        </div>
    )
}
