"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AnalyticsTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Views</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12,543</div>
          <p className="text-xs text-muted-foreground">+12.3% from last month</p>
          <div className="mt-4 h-32 bg-muted/20"></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Watch Time</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1,245 hrs</div>
          <p className="text-xs text-muted-foreground">+5.1% from last month</p>
          <div className="mt-4 h-32 bg-muted/20"></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">+543</div>
          <p className="text-xs text-muted-foreground">+18.2% from last month</p>
          <div className="mt-4 h-32 bg-muted/20"></div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Audience Demographics</CardTitle>
          <CardDescription>Viewer age and gender</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20"></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Where your viewers come from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20"></div>
        </CardContent>
      </Card>
    </div>
  )
}
