"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface CTRAndSEOPredictionProps {
  currentCTR?: number
  predictedCTR?: number
  ctrImprovement?: number
  currentSearchVisibility?: number
  predictedSearchVisibility?: number
  visibilityImprovement?: number
  confidence?: "Low" | "Medium" | "High"
}

export function CTRAndSEOPrediction({
  currentCTR = 2.5,
  predictedCTR = 2.6,
  ctrImprovement = 4,
  currentSearchVisibility = 35,
  predictedSearchVisibility = 62,
  visibilityImprovement = 77,
  confidence = "High",
}: CTRAndSEOPredictionProps) {
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case "High":
        return "bg-green-100 text-green-700"
      case "Medium":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-orange-100 text-orange-700"
    }
  }

  const getConfidenceIcon = (conf: string) => {
    switch (conf) {
      case "High":
        return "✓"
      case "Medium":
        return "◐"
      default:
        return "!"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* CTR Prediction */}
      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            CTR Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current CTR</span>
              <span className="text-2xl font-bold text-foreground">{currentCTR?.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-px bg-border/50" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Predicted CTR</span>
              <span className="text-2xl font-bold text-green-600">{predictedCTR?.toFixed(1)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Improvement</span>
              <span className="text-lg font-bold text-green-600">+{ctrImprovement}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Visibility */}
      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
              <Search className="h-5 w-5" />
            </div>
            SEO Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Visibility</span>
              <span className="text-2xl font-bold text-foreground">{currentSearchVisibility}%</span>
            </div>
          </div>
          <div className="h-px bg-border/50" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Predicted Visibility</span>
              <span className="text-2xl font-bold text-green-600">{predictedSearchVisibility}%</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Boost</span>
              <span className="text-lg font-bold text-green-600">+{visibilityImprovement}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence */}
      <Card className="md:col-span-2 border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Confidence</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="border-border/50 bg-muted/40">
            <AlertDescription className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Model Confidence</span>
              <Badge className={cn("font-semibold px-3 py-1", getConfidenceColor(confidence))}>
                {getConfidenceIcon(confidence)} {confidence}
              </Badge>
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground mt-3">
            Based on video content, performance data, and YouTube trends.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
