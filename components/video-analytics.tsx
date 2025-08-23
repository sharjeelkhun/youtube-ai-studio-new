"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BarChart as LucideBarChart, LineChart, PieChart } from 'lucide-react'

const viewsData = [
  { date: "Jan 1", views: 1200 },
  { date: "Jan 2", views: 1800 },
  { date: "Jan 3", views: 2400 },
  { date: "Jan 4", views: 2000 },
  { date: "Jan 5", views: 2800 },
  { date: "Jan 6", views: 3600 },
  { date: "Jan 7", views: 4200 },
  { date: "Jan 8", views: 3800 },
  { date: "Jan 9", views: 4600 },
  { date: "Jan 10", views: 5200 },
]

const retentionData = [
  { second: "0:00", retention: 100 },
  { second: "0:30", retention: 92 },
  { second: "1:00", retention: 85 },
  { second: "1:30", retention: 78 },
  { second: "2:00", retention: 72 },
  { second: "2:30", retention: 68 },
  { second: "3:00", retention: 64 },
  { second: "3:30", retention: 58 },
  { second: "4:00", retention: 52 },
  { second: "4:30", retention: 48 },
]

const trafficSourceData = [
  { source: "YouTube Search", percentage: 42 },
  { source: "External", percentage: 28 },
  { source: "Suggested Videos", percentage: 18 },
  { source: "Channel Pages", percentage: 8 },
  { source: "Other", percentage: 4 },
]

const demographicsData = [
  { age: "13-17", male: 5, female: 3 },
  { age: "18-24", male: 25, female: 15 },
  { age: "25-34", male: 30, female: 20 },
  { age: "35-44", male: 15, female: 10 },
  { age: "45-54", male: 8, female: 7 },
  { age: "55-64", male: 4, female: 3 },
  { age: "65+", male: 2, female: 1 },
]

interface VideoAnalyticsProps {
  videoId: string
}

export function VideoAnalytics({ videoId }: VideoAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7d")

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load analytics data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [videoId, dateRange])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <LucideBarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2K</div>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
                </CardContent>
              </Card>
              <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers Gained</CardTitle>
            <LucideBarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
                </CardContent>
              </Card>
            </div>

      <Tabs defaultValue="views" className="space-y-4">
        <TabsList>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>
        <TabsContent value="views" className="space-y-4">
            <Card>
              <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                <p className="text-muted-foreground">Views chart will be displayed here</p>
              </div>
              </CardContent>
            </Card>
          </TabsContent>
        <TabsContent value="engagement" className="space-y-4">
            <Card>
              <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                <p className="text-muted-foreground">Engagement metrics will be displayed here</p>
              </div>
              </CardContent>
            </Card>
          </TabsContent>
        <TabsContent value="audience" className="space-y-4">
            <Card>
              <CardHeader>
              <CardTitle>Audience Demographics</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                <p className="text-muted-foreground">Audience demographics will be displayed here</p>
              </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
