"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar, Download, Users, Eye, Clock, ThumbsUp, MessageSquare, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnalyticsChart } from "@/components/charts/analytics-chart"
import { getAnalyticsData } from "@/lib/api"
import type { AnalyticsData } from "@/lib/types"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

export function AnalyticsTab() {
  const [dateRange, setDateRange] = useState("30d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState("views")
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSubtab = (searchParams?.get('tab') as string) || 'overview'
  const [activeTab, setActiveTab] = useState(initialSubtab)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getAnalyticsData(dateRange)
        setAnalyticsData(data)
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load analytics data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  // Sync from URL
  useEffect(() => {
    const t = (searchParams?.get('tab') as string) || 'overview'
    if (t !== activeTab) setActiveTab(t)
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    params.set('tab', value)
    const query = params.toString()
    router.replace(`/analytics${query ? `?${query}` : ''}`)
  }

  const handleExportData = () => {
    toast.info("Export Started", {
      description: "Your analytics data is being prepared for download.",
    })

    // In a real app, this would trigger a download of the analytics data
    setTimeout(() => {
      toast.success("Export Complete", {
        description: "Your analytics data has been downloaded.",
      })
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Channel Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange === "7d"
                  ? "Last 7 days"
                  : dateRange === "30d"
                    ? "Last 30 days"
                    : dateRange === "90d"
                      ? "Last 90 days"
                      : "Custom"}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Views" value="2.4M" change="+12.5%" icon={Eye} />
        <MetricCard title="Watch Time" value="142K hrs" change="+8.2%" icon={Clock} />
        <MetricCard title="Subscribers" value="+2.8K" change="-2.4%" isNegative icon={Users} />
        <MetricCard title="Engagement" value="24.8%" change="+5.1%" icon={ThumbsUp} />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reach">Reach</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
          <Select defaultValue={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="views">Views</SelectItem>
              <SelectItem value="watchTime">Watch Time</SelectItem>
              <SelectItem value="subscribers">Subscribers</SelectItem>
              <SelectItem value="engagement">Engagement Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>View performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AnalyticsChart data={analyticsData} dataKey={selectedMetric} />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Videos</CardTitle>
                <CardDescription>Best performing videos in this period</CardDescription>
              </CardHeader>
              <CardContent>
                <TopVideosTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>Viewer age and gender breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <DemographicsChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reach">
          <Card>
            <CardHeader>
              <CardTitle>Reach Metrics</CardTitle>
              <CardDescription>Impressions, click-through rate, and traffic sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Reach metrics content
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Likes, comments, shares, and watch time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Engagement metrics content
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardHeader>
              <CardTitle>Audience Metrics</CardTitle>
              <CardDescription>Subscriber growth, demographics, and viewing patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Audience metrics content
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
              <CardDescription>Ad revenue, memberships, and Super Chats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Revenue metrics content
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  isNegative?: boolean
  icon: React.ElementType
}

function MetricCard({ title, value, change, isNegative = false, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`mt-1 flex items-center text-xs ${isNegative ? "text-red-500" : "text-green-500"}`}>
          {change}
          <span className="ml-1 text-muted-foreground">vs. previous period</span>
        </p>
      </CardContent>
    </Card>
  )
}

function TopVideosTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">{i}</div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">Video Title {i}</p>
            <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 50000)} views</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center">
              <ThumbsUp className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {Math.floor(Math.random() * 5000)}
            </div>
            <div className="flex items-center">
              <MessageSquare className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {Math.floor(Math.random() * 1000)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DemographicsChart() {
  return (
    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
      Demographics chart placeholder
    </div>
  )
}
