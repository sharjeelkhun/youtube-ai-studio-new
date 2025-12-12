"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Loader2, ArrowUpRight, ArrowDownRight, Users, Clock, Eye, Activity } from "lucide-react"
import { db, type AnalyticsData } from "@/lib/db"
import { cn } from "@/lib/utils"
import { ConnectChannelHero } from "@/components/connect-channel-hero"

export function AnalyticsTab({ channelData, isLoading }: { channelData: any; isLoading: boolean }) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState<"views" | "watch_time" | "subscribers" | "engagement">("views")

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoadingData(true)
      try {
        if (channelData?.id) {
          const days =
            dateRange === "7d"
              ? 7
              : dateRange === "30d"
                ? 30
                : dateRange === "90d"
                  ? 90
                  : dateRange === "365d"
                    ? 365
                    : 30

          const analyticsData = await db.analytics.getByChannelId(channelData.id, days)
          setAnalytics(analyticsData)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (channelData) {
      fetchAnalytics()
    }
  }, [channelData, dateRange])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading channel data...</p>
        </div>
      </div>
    )
  }

  if (!channelData?.id) {
    return (
      <div className="py-8">
        <ConnectChannelHero />
      </div>
    )
  }

  if (isLoadingData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  // Data preparation helpers
  const formatData = (data: AnalyticsData[], key: keyof AnalyticsData) => {
    return data
      .map((item) => ({
        date: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        value: Number(item[key]),
      }))
      .reverse()
  }

  const chartData = formatData(analytics, selectedMetric === "watch_time" ? "watch_time" : selectedMetric)

  // Totals for summary cards
  const calculateTotal = (key: keyof AnalyticsData) => {
    return analytics.reduce((acc, curr) => acc + Number(curr[key]), 0)
  }

  const metrics = [
    {
      id: "views",
      label: "Total Views",
      value: calculateTotal("views").toLocaleString(),
      icon: Eye,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      stroke: "#3b82f6",
      fill: "url(#colorViews)",
      isBar: false
    },
    {
      id: "watch_time",
      label: "Watch Time (h)",
      value: calculateTotal("watch_time").toLocaleString(),
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      stroke: "#f59e0b",
      fill: "url(#colorWatchTime)",
      isBar: false
    },
    {
      id: "subscribers",
      label: "New Subscribers",
      value: calculateTotal("subscribers").toLocaleString(),
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      stroke: "#10b981",
      fill: "url(#colorSubscribers)",
      isBar: true
    },
    {
      id: "engagement",
      label: "Avg Engagement",
      value: Math.round(calculateTotal("engagement") / analytics.length) + "%",
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      stroke: "#a855f7",
      fill: "url(#colorEngagement)",
      isBar: false
    },
  ] as const

  const currentMetric = metrics.find(m => m.id === selectedMetric)!

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-muted-foreground">Track your channel performance in real-time</p>
        </div>
        <Select defaultValue={dateRange} value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main KPI Chart Section */}
      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", currentMetric.bg)}>
              <currentMetric.icon className={cn("h-5 w-5", currentMetric.color)} />
            </div>
            <div>
              <CardTitle className="text-lg font-medium">{currentMetric.label}</CardTitle>
              <CardDescription>
                Detailed breakdown for the selected period
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[350px] w-full pb-4">
          <ResponsiveContainer width="100%" height="100%">
            {currentMetric.isBar ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background)/0.9)",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    color: "hsl(var(--foreground))",
                    marginTop: "10px"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar
                  dataKey="value"
                  fill={currentMetric.stroke}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={currentMetric.fill.replace('url(#', '').replace(')', '')} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.stroke} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currentMetric.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background)/0.9)",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    color: "hsl(var(--foreground))",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentMetric.stroke}
                  strokeWidth={2}
                  fill={currentMetric.fill}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Metric Selector Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-border/50 bg-background/50 backdrop-blur-sm",
              selectedMetric === metric.id ? "ring-2 ring-primary/20 bg-background text-foreground shadow-sm scale-[1.02]" : "hover:bg-background/80 text-muted-foreground"
            )}
            onClick={() => setSelectedMetric(metric.id as any)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className={cn("h-4 w-4", selectedMetric === metric.id ? metric.color : "opacity-50")} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", selectedMetric === metric.id && "text-foreground")}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                View detailed chart
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
