"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "How to Use AI for...", views: 24500 },
  { name: "10 Tips for Better...", views: 18300 },
  { name: "The Ultimate Guide...", views: 16200 },
  { name: "Why You Should...", views: 12800 },
  { name: "Understanding the...", views: 9600 },
]

export function TopVideosChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      {mounted && (
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            dataKey="name"
            type="category"
            scale="band"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={150}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(value) => (value.length > 20 ? `${value.substring(0, 20)}...` : value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
              borderRadius: "8px",
            }}
            formatter={(value) => [`${value?.toLocaleString() ?? "0"} views`, "Views"]}
          />
          <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0] as any} barSize={20} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}
