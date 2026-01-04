"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFeatureAccess } from '@/lib/feature-access'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { BarChart3, Download, Filter, TrendingUp, Calendar, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface AdvancedAnalyticsProps {
  basicMetrics?: {
    totalViews: number
    totalSubscribers: number
    totalVideos: number
    avgEngagement: number
  }
}

export function AdvancedAnalytics({ basicMetrics }: AdvancedAnalyticsProps) {
  const [dateRange, setDateRange] = useState('30d')
  const [exportFormat, setExportFormat] = useState('csv')
  const { hasFeature, getUpgradeMessage } = useFeatureAccess()

  const canUseAdvancedAnalytics = hasFeature('ADVANCED_ANALYTICS')
  const canExportData = hasFeature('DATA_EXPORT')

  const handleExport = () => {
    if (!canExportData) {
      toast.error('Data export requires a premium plan')
      return
    }

    toast.success(`Exporting data as ${exportFormat.toUpperCase()}...`)
    // Implement actual export logic here
  }

  const handleAdvancedFilter = () => {
    if (!canUseAdvancedAnalytics) {
      toast.error('Advanced analytics require a premium plan')
      return
    }

    toast.success('Advanced filters applied')
    // Implement advanced filtering logic here
  }

  if (!canUseAdvancedAnalytics) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-600">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Advanced Analytics</CardTitle>
          <p className="text-muted-foreground">
            Unlock deep insights with custom analytics and detailed performance metrics
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Custom Date Ranges</h3>
                <p className="text-sm text-muted-foreground">Analyze performance for any time period</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Advanced Filtering</h3>
                <p className="text-sm text-muted-foreground">Filter by demographics, devices, and more</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Trend Analysis</h3>
                <p className="text-sm text-muted-foreground">Identify patterns and growth opportunities</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Custom Reports</h3>
                <p className="text-sm text-muted-foreground">Generate detailed performance reports</p>
              </div>
            </div>
            <UpgradePrompt
              feature="ADVANCED_ANALYTICS"
              description={getUpgradeMessage('ADVANCED_ANALYTICS')}
              requiredPlan="Professional"
              currentPlan="Starter"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
            <Badge variant="secondary">Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleAdvancedFilter}>
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <Badge variant="outline">Demographics</Badge>
            <Badge variant="outline">Traffic Sources</Badge>
            <Badge variant="outline">Device Types</Badge>
          </div>

          {/* Export Options */}
          {canExportData && (
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Export Data:</span>
              </div>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleExport}>
                Export Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Export Card for Free Users */}
      {!canExportData && (
        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600">
              <Download className="h-5 w-5 text-white" />
            </div>
            <CardTitle>Data Export</CardTitle>
            <p className="text-muted-foreground">Download comprehensive reports and backup your data</p>
          </CardHeader>
          <CardContent>
            <UpgradePrompt
              feature="DATA_EXPORT"
              description={getUpgradeMessage('DATA_EXPORT')}
              requiredPlan="Professional"
              currentPlan="Starter"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}