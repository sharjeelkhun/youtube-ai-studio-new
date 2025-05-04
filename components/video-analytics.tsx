"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export function VideoAnalytics({ videoId }: { videoId: string }) {
  const { toast } = useToast()
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
        toast({
          title: "Error",
          description: "Failed to load analytics data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [videoId, dateRange, toast])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>
            <Select defaultValue={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="28d">Last 28 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Views Over Time</CardTitle>
                  <CardDescription>Daily views for this video</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewsData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Retention</CardTitle>
                  <CardDescription>Percentage of viewers at each point in the video</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retentionData}>
                      <defs>
                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="second" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value) => [`${value}%`, "Retention"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="retention"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorRetention)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your viewers are coming from</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficSourceData} layout="vertical">
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="source" type="category" width={150} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Demographics</CardTitle>
                  <CardDescription>Age and gender of your viewers</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicsData}>
                      <XAxis dataKey="age" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                      <Bar dataKey="male" name="Male" fill="hsl(var(--primary))" />
                      <Bar dataKey="female" name="Female" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Detailed engagement data for this video</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Engagement metrics content</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Audience Metrics</CardTitle>
                <CardDescription>Detailed audience data for this video</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Audience metrics content</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Detailed revenue data for this video</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Revenue metrics content</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
