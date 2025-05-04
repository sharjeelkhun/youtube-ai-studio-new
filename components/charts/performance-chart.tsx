"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"

const data = [
  { date: "Jan 1", views: 4000, engagement: 24 },
  { date: "Jan 5", views: 3000, engagement: 22 },
  { date: "Jan 10", views: 5000, engagement: 26 },
  { date: "Jan 15", views: 8000, engagement: 28 },
  { date: "Jan 20", views: 12000, engagement: 32 },
  { date: "Jan 25", views: 10000, engagement: 30 },
  { date: "Jan 30", views: 14000, engagement: 34 },
  { date: "Feb 5", views: 18000, engagement: 36 },
  { date: "Feb 10", views: 16000, engagement: 32 },
  { date: "Feb 15", views: 20000, engagement: 38 },
]

export function PerformanceChart() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </Card>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
            borderRadius: "8px",
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="views"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="engagement"
          stroke="hsl(var(--secondary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
